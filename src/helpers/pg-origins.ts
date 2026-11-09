import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ConnectionOptions } from 'node:tls';
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
  schemaDir: string,
  queries: readonly { name: string; source: string }[]
): Promise<DescribedQueries> {
  const { client, schema } = await connect(url, schemaDir);

  // Ending the client errors every pending query, so nothing can wait on a dead connection.
  // Not using pg's `query_timeout`: its timers are only cleared through a query callback,
  // which submittables don't have, so they would keep the generator alive for the whole
  // timeout and crash it on pg < 8.19.
  const deadline = setTimeout(() => client.end().catch(() => {}), 60_000);
  deadline.unref();

  try {
    // Never let a describe blocked by a lock hang `prisma generate`
    await client.query(`SET lock_timeout = '10s'; SET statement_timeout = '30s'`);

    if (schema) {
      await client.query(`SELECT set_config('search_path', quote_ident($1), false)`, [schema]);
    }

    const defaultSchema: string = (await client.query('SELECT current_schema() AS schema')).rows[0]
      .schema;

    const fieldsByQuery = new Map<string, FieldDef[] | Error>();
    const results = await describeAll(
      client,
      queries.map((query) => query.source)
    );

    for (const [index, query] of queries.entries()) {
      fieldsByQuery.set(query.name, results[index]!);
    }

    const tableIds = new Set<number>();

    for (const fields of fieldsByQuery.values()) {
      if (fields instanceof Error) continue;

      for (const field of fields) {
        if (field.tableID) tableIds.add(toOid(field.tableID));
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
              origin: field.tableID
                ? origins.get(`${toOid(field.tableID)}:${field.columnID}`)
                : undefined
            }))
      );
    }

    return { defaultSchema, queries: described };
  } finally {
    clearTimeout(deadline);
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
    table_id: string;
    column_id: number;
    schema: string;
    table: string;
    column: string;
  }>(
    // oids are unsigned 32 bit, `::int` would wrap the ones above 2^31
    `SELECT c.oid::text AS table_id, a.attnum::int AS column_id, n.nspname AS schema,
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
  on(event: 'noData', listener: () => void): void;
  off(event: 'noData', listener: () => void): void;
}

/**
 * Describes every statement, in as few round trips as possible: one, unless a statement
 * fails, in which case the remaining ones are described again in a new batch.
 */
async function describeAll(client: Client, texts: readonly string[]) {
  const results: (FieldDef[] | Error)[] = [];

  while (results.length < texts.length) {
    const batch = await describeBatch(client, texts.slice(results.length));

    results.push(...batch.described);

    if (!batch.error) {
      continue;
    }

    // Only errors sent by postgres (which have a severity) are specific to a statement,
    // anything else means the connection is gone and so is every remaining statement.
    const isStatementError = 'severity' in batch.error;

    do {
      results.push(batch.error);
    } while (!isStatementError && results.length < texts.length);
  }

  return results;
}

/**
 * Pipelines Parse + Describe of every statement followed by a single Sync, which returns
 * their RowDescriptions without binding or executing anything. Uses pg's submittable
 * interface, the same one `pg-cursor` and `pg-query-stream` are built upon.
 *
 * Each statement answers with either a RowDescription or a NoData (statements returning
 * nothing), which is how responses are matched to statements. When one fails, postgres
 * skips everything up to the Sync, so the error belongs to the first undescribed one.
 */
function describeBatch(client: Client, texts: readonly string[]) {
  return new Promise<{ described: FieldDef[][]; error?: Error }>((resolve) => {
    const described: FieldDef[][] = [];
    let connection: ExtendedProtocolConnection | undefined;

    // pg forwards no NoData to submittables, so it is read from the connection itself
    const onNoData = () => described.push([]);
    const done = (error?: Error) => {
      connection?.off('noData', onNoData);
      resolve({ described, error });
    };

    client.query({
      submit(con: ExtendedProtocolConnection) {
        connection = con;
        con.on('noData', onNoData);

        for (const text of texts) {
          con.parse({ text, types: [] });
          con.describe({ type: 'S', name: '' });
        }

        con.sync();
      },
      handleRowDescription(message: { fields: FieldDef[] }) {
        described.push(message.fields);
      },
      // pg drops the active query on errors, so ReadyForQuery never reaches us afterwards
      handleError(error: Error) {
        done(error);
      },
      handleReadyForQuery() {
        done();
      }
    } as never);
  });
}

/** Older pg-protocol versions read the table oid as a signed int32 */
function toOid(tableId: number) {
  return tableId >>> 0;
}

/**
 * Connects the same way prisma's schema engine does, which is what `prisma generate --sql`
 * used to introspect the queries. Prisma's url parameters differ from libpq's, which pg
 * follows, so they are translated instead of being handed to pg as is.
 *
 * https://www.prisma.io/docs/orm/overview/databases/postgresql#arguments
 */
async function connect(url: string, schemaDir: string) {
  const pg = loadPg();
  const parsed = new URL(resolvePrismaDevUrl(url));
  const params = parsed.searchParams;

  // Applied as the search_path, which decides what an unqualified table name refers to
  const schema = params.get('schema');

  const sslmode = params.get('sslmode') ?? 'prefer';
  const sslcert = params.get('sslcert');
  const sslidentity = params.get('sslidentity');
  const ssl: ConnectionOptions = {
    // Prisma defaults to accept_invalid_certs, only `strict` verifies the certificate
    rejectUnauthorized: params.get('sslaccept') === 'strict',
    // Prisma resolves certificate paths relative to the schema
    ca: sslcert ? await fs.readFile(resolve(schemaDir, sslcert)) : undefined,
    pfx: sslidentity ? await fs.readFile(resolve(schemaDir, sslidentity)) : undefined,
    passphrase: params.get('sslpassword') ?? undefined
  };

  // Otherwise pg would apply its own (libpq) meaning to them, overriding `ssl` below
  for (const param of [...params.keys()]) {
    if (param === 'schema' || param === 'ssl' || param.startsWith('ssl')) {
      params.delete(param);
    }
  }

  const create = (useSsl: boolean) => {
    const client = new pg.Client({
      connectionString: parsed.toString(),
      ssl: useSsl ? ssl : false,
      connectionTimeoutMillis: 10_000,
      application_name: 'prisma-json-types-generator'
    });

    // Without a listener, a connection dropped by the server would crash the process.
    // The error still reaches us through the pending query.
    client.on('error', () => {});

    return client;
  };

  let client = create(sslmode !== 'disable');

  try {
    await client.connect();
  } catch (error) {
    // `prefer` tries TLS first and falls back to plaintext, like prisma and libpq
    if (sslmode !== 'prefer' || !/does not support SSL/i.test(String(error))) {
      throw error;
    }

    await client.end().catch(() => {});
    client = create(false);
    await client.connect();
  }

  return { client, schema };
}

/**
 * `prisma dev` urls point to an HTTP server, the actual postgres url is encoded in its api
 * key. Remote Prisma Postgres urls cannot be used for introspection, by prisma or by us.
 */
function resolvePrismaDevUrl(url: string) {
  if (!url.startsWith('prisma+postgres:')) {
    return url;
  }

  try {
    const apiKey = new URL(url).searchParams.get('api_key') ?? '';
    const { databaseUrl } = JSON.parse(Buffer.from(apiKey, 'base64url').toString('utf8'));

    if (typeof databaseUrl === 'string' && /^postgres(ql)?:\/\//.test(databaseUrl)) {
      return databaseUrl;
    }
  } catch {}

  throw new Error(
    '`prisma+postgres://` urls are only supported for `prisma dev`, point the `typedSqlUrlEnv` option to a variable with a direct `postgres://` url'
  );
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
