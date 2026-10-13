import type { Client, FieldDef } from 'pg';

/** The table column a query result column was read from. */
export interface ColumnOrigin {
  schema: string;
  table: string;
  column: string;
}

/** A result column as described by postgres, with its origin when it has one. */
export interface DescribedColumn {
  name: string;
  origin: ColumnOrigin | undefined;
}

export interface DescribedQueries {
  /** The schema unqualified tables resolve to, which is where models without `@@schema` live */
  defaultSchema: string;
  /** The described columns of each query, or the error that prevented describing it */
  queries: Map<string, DescribedColumn[] | Error>;
}

/**
 * Asks postgres where each result column of each query comes from.
 *
 * Postgres tracks the originating table and column of every result column that is a plain
 * column reference, through aliases, joins, subqueries in FROM and CTEs, and reports them
 * as `(table oid, attnum)` in its RowDescription. Computed expressions report no origin.
 * This is what prisma itself uses to infer nullability, so it is exact rather than a guess
 * based on column names.
 *
 * Queries are only parsed and described, never executed, so write queries are safe.
 */
export async function describeQueryOrigins(
  url: string,
  queries: readonly { name: string; source: string }[]
): Promise<DescribedQueries> {
  const pg = loadPg();
  const parsedUrl = new URL(url);

  // `?schema=` is prisma specific and is applied as the search_path by prisma, which
  // decides which table an unqualified name refers to.
  const schema = parsedUrl.searchParams.get('schema');
  parsedUrl.searchParams.delete('schema');

  const client = new pg.Client({
    connectionString: parsedUrl.toString(),
    connectionTimeoutMillis: 10_000,
    application_name: 'prisma-json-types-generator'
  });

  await client.connect();

  try {
    if (schema) {
      await client.query(`SELECT set_config('search_path', quote_ident($1), false)`, [schema]);
    }

    const defaultSchema: string = (await client.query('SELECT current_schema() AS schema')).rows[0]
      .schema;

    const fieldsByQuery = new Map<string, FieldDef[] | Error>();

    for (const query of queries) {
      fieldsByQuery.set(
        query.name,
        await describe(client, query.source).catch((error: Error) => error)
      );
    }

    const tableIds = new Set<number>();

    for (const fields of fieldsByQuery.values()) {
      if (fields instanceof Error) continue;

      for (const field of fields) {
        if (field.tableID) tableIds.add(field.tableID);
      }
    }

    const origins = await loadColumnNames(client, [...tableIds]);
    const described = new Map<string, DescribedColumn[] | Error>();

    for (const [name, fields] of fieldsByQuery) {
      described.set(
        name,
        fields instanceof Error
          ? fields
          : fields.map((field) => ({
              name: field.name,
              origin: field.tableID ? origins.get(`${field.tableID}:${field.columnID}`) : undefined
            }))
      );
    }

    return { defaultSchema, queries: described };
  } finally {
    await client.end().catch(() => {});
  }
}

/** Resolves `(table oid, attnum)` pairs into schema, table and column names. */
async function loadColumnNames(client: Client, tableIds: number[]) {
  const origins = new Map<string, ColumnOrigin>();

  if (!tableIds.length) {
    return origins;
  }

  const { rows } = await client.query<{
    table_id: number;
    column_id: number;
    schema: string;
    table: string;
    column: string;
  }>(
    `SELECT c.oid::int AS table_id, a.attnum::int AS column_id, n.nspname AS schema,
            c.relname AS table, a.attname AS column
       FROM pg_catalog.pg_attribute a
       JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
       JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE a.attrelid = ANY($1::oid[]) AND a.attnum > 0 AND NOT a.attisdropped`,
    [tableIds]
  );

  for (const row of rows) {
    origins.set(`${row.table_id}:${row.column_id}`, {
      schema: row.schema,
      table: row.table,
      column: row.column
    });
  }

  return origins;
}

/** The parts of pg's (loosely typed) `Connection` used by submittables. */
interface ExtendedProtocolConnection {
  parse(query: { text: string; types: number[] }): void;
  describe(message: { type: 'S' | 'P'; name: string }): void;
  sync(): void;
}

/**
 * Sends Parse + Describe + Sync for an unnamed statement, which returns the RowDescription
 * without binding or executing anything. Uses pg's submittable interface, the same one
 * `pg-cursor` and `pg-query-stream` are built upon.
 */
function describe(client: Client, text: string) {
  return new Promise<FieldDef[]>((resolve, reject) => {
    let fields: FieldDef[] = [];

    client.query({
      submit(connection: ExtendedProtocolConnection) {
        connection.parse({ text, types: [] });
        connection.describe({ type: 'S', name: '' });
        connection.sync();
      },
      handleRowDescription(message: { fields: FieldDef[] }) {
        fields = message.fields;
      },
      // pg drops the active query on errors, so ReadyForQuery never reaches us afterwards
      handleError(error: Error) {
        reject(error);
      },
      handleReadyForQuery() {
        resolve(fields);
      }
    } as never);
  });
}

function loadPg(): typeof import('pg') {
  try {
    return require('pg');
  } catch {
    throw new Error(
      'the `pg` package is required to resolve TypedSQL columns to their schema fields, install it with `npm i -D pg`'
    );
  }
}
