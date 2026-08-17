import fs from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { GeneratorOptions, SqlQueryOutput } from '@prisma/generator';
import ts from 'typescript';
import { handlePrismaModule } from './handler/module';
import { handleStatement } from './handler/statement';
import { columnDocsKey, handleTypedSqlFile, parseSqlAnnotations } from './handler/typedsql';
import { extractPrismaModels } from './helpers/dmmf';
import { type PrismaJsonTypesGeneratorConfig, parseConfig } from './util/config';
import { createType } from './util/create-signature';
import { DeclarationWriter, getNamespacePrelude } from './util/declaration-writer';
import { findPrismaClientGenerators, type GeneratorWithOutput } from './util/prisma-generator';
import { buildTypesFilePath } from './util/source-path';

/** Runs the generator with the given options. */
export async function onGenerate(options: GeneratorOptions) {
  try {
    const config = parseConfig(options.generator.config);
    const clients = findPrismaClientGenerators(options.otherGenerators);

    // Run them all in parallel
    await Promise.all(clients.map((client) => generateClient(client, config, options)));

    // Ensures we don't crash the generator process
  } catch (error) {
    console.error(error);
  }
}

async function generateClient(
  prismaClient: GeneratorWithOutput,
  config: PrismaJsonTypesGeneratorConfig,
  options: GeneratorOptions
) {
  const ext = prismaClient.config.importFileExtension?.toString();
  const isNewClient =
    (prismaClient.provider.fromEnvVar || prismaClient.provider.value) === 'prisma-client';

  if (isNewClient) {
    const modelsFolder = join(prismaClient.output.value, 'models');
    const stat = await fs.stat(modelsFolder).catch(() => null);

    // Models are split into multiple files starting in prisma@6.7
    if (stat?.isDirectory()) {
      for (const modelFile of await fs.readdir(modelsFolder)) {
        await handleDeclarationFile(join(modelsFolder, modelFile), config, options, ext, true);
      }

      await fs.writeFile(
        join(prismaClient.output.value, 'pjtg.ts'),
        await getNamespacePrelude({
          namespace: config.namespace,
          isNewClient: true,
          dotExt: ext ? `.${ext}` : ''
        })
      );

      // Process TypedSQL queries after pjtg.ts is in place
      await handleTypedSqlQueries(prismaClient, config, options, ext, true);

      return;
    }
  }

  const clientOutput = isNewClient
    ? join(prismaClient.output.value, 'client.ts')
    : buildTypesFilePath(prismaClient.output.value, config.clientOutput, options.schemaPath);

  await handleDeclarationFile(clientOutput, config, options, ext, false);

  await handleTypedSqlQueries(prismaClient, config, options, ext, isNewClient);
}

async function handleTypedSqlQueries(
  prismaClient: GeneratorWithOutput,
  config: PrismaJsonTypesGeneratorConfig,
  options: GeneratorOptions,
  importFileExtension: string | undefined,
  isNewClient: boolean
) {
  const typedSql = options.typedSql;
  if (!typedSql?.length) return;

  const sqlDir = join(prismaClient.output.value, 'sql');
  const sqlDirStat = await fs.stat(sqlDir).catch(() => null);
  if (!sqlDirStat?.isDirectory()) return;

  // Only the queries prisma actually emitted a file for. `sql/` also holds an index and,
  // for the old client, a layout we don't rewrite — so this can legitimately be empty.
  const queries: { query: SqlQueryOutput; filepath: string }[] = [];

  for (const query of typedSql) {
    const filepath = join(sqlDir, `${query.name}.ts`);
    const fileStat = await fs.stat(filepath).catch(() => null);

    if (fileStat?.isFile()) {
      queries.push({ query, filepath });
    }
  }

  if (queries.length === 0) return;

  // Rewritten files import PJTG from a sibling of sql/. The multifile client already
  // wrote it; every other layout needs it created here, and only once we know there is
  // something to rewrite — otherwise we'd leave a stray file in the client output.
  const pjtgPath = join(prismaClient.output.value, 'pjtg.ts');

  if (!(await fs.stat(pjtgPath).catch(() => null))) {
    await fs.writeFile(
      pjtgPath,
      await getNamespacePrelude({
        namespace: config.namespace,
        isNewClient,
        dotExt: importFileExtension ? `.${importFileExtension}` : ''
      })
    );
  }

  const { columnDocs, ambiguous } = buildColumnDocs(options.dmmf.datamodel.models, config);

  // SQL source files live next to the schema file (e.g. prisma/sql/<queryName>.sql)
  const sqlSourceDir = join(dirname(options.schemaPath), 'sql');

  for (const { query, filepath } of queries) {
    let sqlAnnotations: Map<string, string> | undefined;
    const sqlSourcePath = join(sqlSourceDir, `${query.name}.sql`);
    const sqlContent = await fs.readFile(sqlSourcePath, 'utf-8').catch(() => null);
    if (sqlContent) {
      sqlAnnotations = parseSqlAnnotations(sqlContent);
    }

    // Per-query column docs: resolve each column against the model-based map by the kind
    // prisma introspected for it, then overlay any SQL-file annotations so that complex
    // queries with aliases / computed columns are covered.
    const queryColumnDocs = new Map<string, string | undefined>();

    for (const column of query.resultColumns) {
      queryColumnDocs.set(column.name, columnDocs.get(columnDocsKey(column.typ, column.name)));
    }

    for (const [column, annotation] of sqlAnnotations ?? []) {
      queryColumnDocs.set(column, annotation);
    }

    warnAboutAmbiguousColumns(query, ambiguous, sqlAnnotations);

    await handleTypedSqlDeclarationFile(
      filepath,
      query,
      queryColumnDocs,
      config,
      importFileExtension
    );
  }
}

/**
 * Builds the column → documentation lookup used to type TypedSQL result columns, keyed by
 * `columnDocsKey`: the column's name, qualified by the scalar type it was read from.
 *
 * Every field is registered, not only the `Json` ones: a `String` field annotated
 * `/// [UserIdString]` types its TypedSQL column exactly as it types the model payload. A
 * field with no annotation is registered too, resolving to the same nothing an unannotated
 * `Json` field does, so that a model which does *not* annotate a column is counted as
 * disagreeing with one that does rather than being invisible to the check below.
 *
 * A field is registered under both its `@map` db column name and its prisma field name,
 * because prisma reports result columns by their name *in the query output*: bare
 * `SELECT provider_data` yields the db name, while the usual `SELECT provider_data AS
 * "providerData"` yields the field name. Keying on only one of the two silently misses
 * every query written in the other style.
 *
 * Column names are only unique within a model and prisma does not tell us which table a
 * result column came from, so a column claimed by several models that do not agree on its
 * annotation is reported as ambiguous and left unannotated. Guessing one of them would
 * silently hand out the wrong type; `-- @pjt-type` disambiguates explicitly. Only models
 * that could actually have produced the column collide, since the key carries the scalar
 * type: an annotated `Json` field and a `String` field of the same name are two different
 * columns, and prisma says which one a query returned.
 */
export function buildColumnDocs(
  models: readonly {
    readonly fields: readonly {
      readonly name: string;
      readonly type: string;
      readonly dbName?: string | null;
      readonly documentation?: string;
    }[];
  }[],
  config: PrismaJsonTypesGeneratorConfig
) {
  const columnDocs = new Map<string, string | undefined>();
  const resolvedTypes = new Map<string, string>();
  const ambiguous = new Set<string>();

  for (const model of models) {
    for (const field of model.fields) {
      const type = createType(field.documentation, config);

      for (const name of new Set([field.dbName ?? field.name, field.name])) {
        const column = `${field.type}:${name}`;

        if (!columnDocs.has(column)) {
          columnDocs.set(column, field.documentation);
          resolvedTypes.set(column, type);
          continue;
        }

        // Models agreeing on the type are not ambiguous, only conflicting ones are
        if (resolvedTypes.get(column) !== type) {
          ambiguous.add(column);
        }
      }
    }
  }

  for (const column of ambiguous) {
    columnDocs.set(column, undefined);
  }

  return { columnDocs, ambiguous };
}

/** Warns about ambiguous columns a query actually selects and does not itself annotate. */
function warnAboutAmbiguousColumns(
  query: SqlQueryOutput,
  ambiguous: Set<string>,
  sqlAnnotations: Map<string, string> | undefined
) {
  // Only json columns are worth warning about. An ambiguous column of any other kind keeps
  // the type prisma wrote for it, so nothing got worse; a json column falls back to
  // `unknown`, which is a type the caller has to deal with.
  const unresolved = query.resultColumns
    .filter((column) => column.typ === 'json' || column.typ === 'json-array')
    .filter(
      (column) =>
        ambiguous.has(columnDocsKey(column.typ, column.name)) && !sqlAnnotations?.has(column.name)
    )
    .map((column) => column.name);

  if (unresolved.length === 0) return;

  // Generators talk JSON-RPC over stderr, so stdout (which prisma inherits) is the only
  // stream that actually reaches the user.
  console.log(
    `prisma-json-types-generator: ${query.name}.sql selects ${unresolved
      .map((column) => `\`${column}\``)
      .join(', ')}, which multiple models annotate differently. ` +
      'Annotate the column in the SQL file to resolve it, e.g. `-- @pjt-type ' +
      `${unresolved[0]} [YourType]\`.`
  );
}

async function handleTypedSqlDeclarationFile(
  filepath: string,
  query: SqlQueryOutput,
  columnDocs: Map<string, string | undefined>,
  config: PrismaJsonTypesGeneratorConfig,
  importFileExtension: string | undefined
) {
  // TypedSQL files live in sql/ (one level below client output), same as model files in
  // the multifile layout — so multifile=true causes the writer to emit
  // `import type * as PJTG from '../pjtg'`, which is the correct relative path.
  const writer = new DeclarationWriter(filepath, config, true, importFileExtension);
  await writer.load();

  const tsSource = ts.createSourceFile(
    writer.filepath,
    writer.content,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );

  try {
    handleTypedSqlFile(tsSource, writer, query, columnDocs, config);
  } catch (error) {
    console.error(error);
  }

  await writer.save();
}

async function handleDeclarationFile(
  filepath: string,
  config: PrismaJsonTypesGeneratorConfig,
  options: GeneratorOptions,
  importFileExtension: string | undefined,
  multifile: boolean
) {
  const writer = new DeclarationWriter(filepath, config, multifile, importFileExtension);

  // Reads the prisma declaration file content.
  await writer.load();

  const tsSource = ts.createSourceFile(
    writer.filepath,
    writer.content,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );

  const { typeToNameMap, modelMap, knownNoOps } = extractPrismaModels(options.dmmf);

  // Handles the prisma namespace.
  tsSource.forEachChild((child) => {
    try {
      if (!multifile) {
        if (child.kind === ts.SyntaxKind.ModuleDeclaration) {
          handlePrismaModule(
            child as ts.ModuleDeclaration,
            writer,
            modelMap,
            knownNoOps,
            typeToNameMap,
            config
          );
        }
      } else {
        if (ts.isStatement(child)) {
          handleStatement(
            child as ts.Statement,
            writer,
            modelMap,
            typeToNameMap,
            knownNoOps,
            config
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  });

  await writer.save();
}
