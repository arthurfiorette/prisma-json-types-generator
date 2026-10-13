import fs from 'node:fs/promises';
import { join } from 'node:path';
import { styleText } from 'node:util';
import type { GeneratorOptions } from '@prisma/generator';
import ts from 'typescript';
import { handlePrismaModule } from './handler/module';
import { handleStatement } from './handler/statement';
import { handleTypedSqlFiles, resolveTypedSqlTypes } from './handler/typedsql';
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

    // Resolved once, as it may need a database round trip, and shared by all clients
    const typedSqlTypes = await resolveTypedSqlTypes(options, config, warn);

    // Run them all in parallel
    await Promise.all(
      clients.map(async (client) => {
        await generateClient(client, config, options);
        await handleTypedSqlFiles(
          client.output.value,
          isNewClient(client),
          getImportFileExtension(client),
          typedSqlTypes
        );
      })
    );

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
  const ext = getImportFileExtension(prismaClient);

  if (isNewClient(prismaClient)) {
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

      return;
    }
  }

  const clientOutput = isNewClient(prismaClient)
    ? join(prismaClient.output.value, 'client.ts')
    : buildTypesFilePath(prismaClient.output.value, config.clientOutput, options.schemaPath);

  await handleDeclarationFile(clientOutput, config, options, ext, false);
}

function isNewClient(prismaClient: GeneratorWithOutput) {
  return (prismaClient.provider.fromEnvVar || prismaClient.provider.value) === 'prisma-client';
}

function getImportFileExtension(prismaClient: GeneratorWithOutput) {
  return prismaClient.config.importFileExtension?.toString();
}

// Generators talk JSON-RPC over stderr, stdout is what reaches the user
function warn(message: string) {
  console.log(styleText('yellow', `prisma-json-types-generator: ${message}`));
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
