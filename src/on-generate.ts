import type { GeneratorOptions } from '@prisma/generator-helper';
import ts from 'typescript';
import { handleModule } from './handler/module';
import { parseDmmf } from './helpers/dmmf';
import { DeclarationWriter } from './util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from './util/error';
import { findPrismaClientGenerator } from './util/prisma-generator';

/** Runs the generator with the given options. */
export async function onGenerate(options: GeneratorOptions) {
  // Default namespace is `PrismaJson`
  options.generator.config.namespace ??= 'PrismaJson';

  const prismaClient = findPrismaClientGenerator(options.otherGenerators);

  const writer = new DeclarationWriter(
    prismaClient.output.value,
    options.generator.config.clientOutput,
    options.schemaPath
  );

  await writer.load();

  const tsSource = ts.createSourceFile(
    writer.sourcePath,
    writer.content,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );

  const models = parseDmmf(options.dmmf);

  tsSource.forEachChild((child) => {
    try {
      switch (child.kind) {
        // Main model type is inside Prisma namespace
        case ts.SyntaxKind.ModuleDeclaration:
          return handleModule(
            child as ts.ModuleDeclaration,
            writer,
            models,
            options.generator.config.namespace!,
            options.generator.config.useType
          );
      }
    } catch (error) {
      // This allows some types to be generated even if others may fail
      // which is good for incremental development/testing
      if (error instanceof PrismaJsonTypesGeneratorError) {
        return PrismaJsonTypesGeneratorError.handler(error);
      }

      // Stops this generator is error thrown is not manually added by our code.
      throw error;
    }
  });

  await writer.update(options.generator.config.namespace);
}
