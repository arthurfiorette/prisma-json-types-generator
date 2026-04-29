import fs from 'node:fs/promises';
import { join } from 'node:path';
import type { GeneratorOptions, SqlQueryOutput } from '@prisma/generator';
import ts from 'typescript';
import { handlePrismaModule } from './handler/module';
import { handleStatement } from './handler/statement';
import { handleTypedSqlFile } from './handler/typedsql';
import { extractPrismaModels } from './helpers/dmmf';
import { type PrismaJsonTypesGeneratorConfig, parseConfig } from './util/config';
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
      await handleTypedSqlQueries(prismaClient, config, options, ext);

      return;
    }
  }

  const clientOutput = isNewClient
    ? join(prismaClient.output.value, 'client.ts')
    : buildTypesFilePath(prismaClient.output.value, config.clientOutput, options.schemaPath);

  await handleDeclarationFile(clientOutput, config, options, ext, false);

  // For TypedSQL with old-client (or new-client single-file mode), ensure pjtg.ts exists
  if (options.typedSql?.length) {
    if (!isNewClient) {
      const pjtgPath = join(prismaClient.output.value, 'pjtg.ts');
      if (!(await fs.stat(pjtgPath).catch(() => null))) {
        await fs.writeFile(
          pjtgPath,
          await getNamespacePrelude({
            namespace: config.namespace,
            isNewClient: false,
            dotExt: ext ? `.${ext}` : ''
          })
        );
      }
    }
    await handleTypedSqlQueries(prismaClient, config, options, ext);
  }
}

async function handleTypedSqlQueries(
  prismaClient: GeneratorWithOutput,
  config: PrismaJsonTypesGeneratorConfig,
  options: GeneratorOptions,
  importFileExtension: string | undefined
) {
  const typedSql = options.typedSql;
  if (!typedSql?.length) return;

  const sqlDir = join(prismaClient.output.value, 'sql');
  const sqlDirStat = await fs.stat(sqlDir).catch(() => null);
  if (!sqlDirStat?.isDirectory()) return;

  // Build column name → documentation lookup from all Json fields in the schema.
  // Uses the @map db column name when present; first model wins on collisions.
  const columnDocs = new Map<string, string | undefined>();
  for (const model of options.dmmf.datamodel.models) {
    for (const field of model.fields) {
      if (field.type !== 'Json') continue;
      const col = field.dbName ?? field.name;
      if (!columnDocs.has(col)) columnDocs.set(col, field.documentation);
    }
  }

  for (const query of typedSql) {
    const filePath = join(sqlDir, `${query.name}.ts`);
    const fileStat = await fs.stat(filePath).catch(() => null);
    if (!fileStat?.isFile()) continue;

    await handleTypedSqlDeclarationFile(filePath, query, columnDocs, config, importFileExtension);
  }
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
