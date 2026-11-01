import fs from 'node:fs/promises';
import { join } from 'node:path';
import { styleText } from 'node:util';
import type { GeneratorOptions } from '@prisma/generator';
import { handlePrismaModule } from './handler/module';
import { handleStatement } from './handler/statement';
import { handleTypedSqlFiles, resolveTypedSqlTypes } from './handler/typedsql';
import { extractPrismaModels, type PrismaModels } from './helpers/dmmf';
import { parseSource, unwrapExport } from './util/ast';
import { type PrismaJsonTypesGeneratorConfig, parseConfig } from './util/config';
import { DeclarationWriter, getNamespacePrelude } from './util/declaration-writer';
import { findPrismaClientGenerators, type GeneratorWithOutput } from './util/prisma-generator';
import { buildTypesFilePath } from './util/source-path';

/** Runs the generator with the given options. */
export async function onGenerate(options: GeneratorOptions) {
  try {
    const config = parseConfig(options.generator.config);
    const clients = findPrismaClientGenerators(options.otherGenerators);

    // prisma-client emits one declaration file per model, so this runs once for all of them
    const models = extractPrismaModels(options.dmmf);

    // Resolved once, as it may need a database round trip, and shared by all clients
    const typedSqlTypes = await resolveTypedSqlTypes(options, config, warn);

    // Run them all in parallel
    await Promise.all(
      clients.map(async (client) => {
        await generateClient(client, config, options, models);
        await handleTypedSqlFiles(
          client.output.value,
          isNewClient(client),
          isNewClient(client) ? getGeneratedFileExtension(client) : 'd.ts',
          getImportFileExtension(client),
          typedSqlTypes,
          warn
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
  options: GeneratorOptions,
  models: PrismaModels
) {
  const ext = getImportFileExtension(prismaClient);

  if (isNewClient(prismaClient)) {
    const modelsFolder = join(prismaClient.output.value, 'models');
    const stat = await fs.stat(modelsFolder).catch(() => null);

    // Models are split into multiple files starting in prisma@6.7
    if (stat?.isDirectory()) {
      for (const modelFile of await fs.readdir(modelsFolder)) {
        await handleDeclarationFile(join(modelsFolder, modelFile), config, models, ext, true);
      }

      await fs.writeFile(
        // Model files import `../pjtg.<importFileExtension>`, which only resolves to a
        // file with the same extension as the other generated files
        join(prismaClient.output.value, `pjtg.${getGeneratedFileExtension(prismaClient)}`),
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

  await handleDeclarationFile(clientOutput, config, models, ext, false);
}

function isNewClient(prismaClient: GeneratorWithOutput) {
  return (prismaClient.provider.fromEnvVar || prismaClient.provider.value) === 'prisma-client';
}

function getImportFileExtension(prismaClient: GeneratorWithOutput) {
  return prismaClient.config.importFileExtension?.toString();
}

function getGeneratedFileExtension(prismaClient: GeneratorWithOutput) {
  return prismaClient.config.generatedFileExtension?.toString() ?? 'ts';
}

// Generators talk JSON-RPC over stderr, stdout is what reaches the user
function warn(message: string) {
  console.log(styleText('yellow', `prisma-json-types-generator: ${message}`));
}

async function handleDeclarationFile(
  filepath: string,
  config: PrismaJsonTypesGeneratorConfig,
  { typeToNameMap, modelMap, knownNoOps }: PrismaModels,
  importFileExtension: string | undefined,
  multifile: boolean
) {
  const writer = new DeclarationWriter(filepath, config, multifile, importFileExtension);

  // Reads the prisma declaration file content.
  await writer.load();

  const program = parseSource(writer.filepath, writer.content);

  // Handles the prisma namespace.
  for (const child of program.body) {
    try {
      if (!multifile) {
        const declaration = unwrapExport(child);

        if (declaration?.type === 'TSModuleDeclaration' && declaration.kind !== 'global') {
          handlePrismaModule(declaration, writer, modelMap, knownNoOps, typeToNameMap, config);
        }
      } else {
        handleStatement(child, writer, modelMap, typeToNameMap, knownNoOps, config);
      }
    } catch (error) {
      console.error(error);
    }
  }

  await writer.save();
}
