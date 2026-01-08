import fs from 'node:fs/promises';
import { join } from 'node:path';
import type { GeneratorOptions } from '@prisma/generator';
import ts from 'typescript';
import { handlePrismaModule } from './handler/module';
import { handleStatement } from './handler/statement';
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

      return;
    }
  }

  const clientOutput = isNewClient
    ? join(prismaClient.output.value, 'client.ts')
    : buildTypesFilePath(prismaClient.output.value, config.clientOutput, options.schemaPath);

  await handleDeclarationFile(clientOutput, config, options, ext, false);
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
