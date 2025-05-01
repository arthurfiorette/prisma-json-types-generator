import fs from 'node:fs/promises';
import { join } from 'node:path';
import type { GeneratorOptions } from '@prisma/generator';
import ts from 'typescript';
import { handlePrismaModule } from './handler/module';
import { handleStatement } from './handler/statement';
import { extractPrismaModels } from './helpers/dmmf';
import { type PrismaJsonTypesGeneratorConfig, parseConfig } from './util/config';
import { LIB_HEADER } from './util/constants';
import { DeclarationWriter, getNamespacePrelude } from './util/declaration-writer';
import { findPrismaClientGenerator } from './util/prisma-generator';
import { buildTypesFilePath } from './util/source-path';

/** Runs the generator with the given options. */
export async function onGenerate(options: GeneratorOptions) {
  try {
    const prismaClient = findPrismaClientGenerator(options.otherGenerators);

    const config = parseConfig(options.generator.config);

    const isNewClient =
      (prismaClient.provider.fromEnvVar || prismaClient.provider.value) === 'prisma-client';
    if (isNewClient) {
      try {
        const modelsFolder = join(prismaClient.output.value, 'models');
        const stat = await fs.stat(modelsFolder);
        if (stat.isDirectory()) {
          // Models are split into multiple files starting in prisma@6.7
          for (const modelFile of await fs.readdir(modelsFolder)) {
            try {
              await handleDeclarationFile(join(modelsFolder, modelFile), config, options, true);
            } catch (error) {
              console.error(error);
            }
          }

          await fs.writeFile(
            join(prismaClient.output.value, 'pjtg.ts'),
            `${LIB_HEADER}\n${await getNamespacePrelude(config.namespace)}`
          );
          return;
        }
      } catch {}
    }

    const clientOutput = isNewClient
      ? join(prismaClient.output.value, 'client.ts')
      : buildTypesFilePath(prismaClient.output.value, config.clientOutput, options.schemaPath);
    await handleDeclarationFile(clientOutput, config, options);
  } catch (error) {
    console.error(error);
  }
}

async function handleDeclarationFile(
  filepath: string,
  config: PrismaJsonTypesGeneratorConfig,
  options: GeneratorOptions,
  multifile = false
) {
  const writer = new DeclarationWriter(filepath, config, multifile);

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
