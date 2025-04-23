import type { GeneratorOptions } from '@prisma/generator';
import ts from 'typescript';
import { handlePrismaModule } from './handler/module';
import { extractPrismaModels } from './helpers/dmmf';
import { parseConfig } from './util/config';
import { DeclarationWriter } from './util/declaration-writer';
import { findPrismaClientGenerator } from './util/prisma-generator';
import { buildTypesFilePath } from './util/source-path';

/** Runs the generator with the given options. */
export async function onGenerate(options: GeneratorOptions) {
  try {
    const prismaClient = findPrismaClientGenerator(options.otherGenerators);

    const config = parseConfig(options.generator.config);

    const clientOutput = buildTypesFilePath(
      prismaClient.output.value,
      config.clientOutput,
      options.schemaPath
    );

    const writer = new DeclarationWriter(clientOutput, config);

    // Reads the prisma declaration file content.
    await writer.load();

    const tsSource = ts.createSourceFile(
      writer.filepath,
      writer.content,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS
    );

    const prismaModels = extractPrismaModels(options.dmmf);

    // Handles the prisma namespace.
    tsSource.forEachChild((child) => {
      try {
        if (child.kind === ts.SyntaxKind.ModuleDeclaration) {
          handlePrismaModule(child as ts.ModuleDeclaration, writer, prismaModels, config);
        }
      } catch (error) {
        console.error(error);
      }
    });

    await writer.save();
  } catch (error) {
    console.error(error);
  }
}
