import type { GeneratorOptions } from '@prisma/generator-helper';
import ts from 'typescript';
import { readPrismaDeclarations } from './file/reader';
import { handleModule } from './handler/module';
import { handleTypeAlias } from './handler/type-alias';
import { parseDmmf } from './helpers/dmmf';

export async function onGenerate(options: GeneratorOptions) {
  const nsName = options.generator.config.namespace || 'PrismaJson';

  const prismaClientOptions = options.otherGenerators.find((g) => g.name === 'client');

  if (!prismaClientOptions) {
    throw new Error(
      'Could not find client generator options, are you using prisma-client-js before prisma-json-types-generator?'
    );
  }

  if (!prismaClientOptions.output?.value) {
    throw new Error(
      'prisma client output not found: ' + JSON.stringify(prismaClientOptions, null, 2)
    );
  }
 
 
  const { content, replacer, sourcePath, update } = await readPrismaDeclarations(
    nsName, 
    prismaClientOptions.output.value,
    options.generator.config.clientOutput,
    options.schemaPath
  );

  const tsSource = ts.createSourceFile(
    sourcePath,
    content,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );

  const models = parseDmmf(options.dmmf);

  const promises: Promise<void>[] = [];

  tsSource.forEachChild((child) => {
    switch (child.kind) {
      case ts.SyntaxKind.TypeAliasDeclaration:
        promises.push(
          handleTypeAlias(
            child as ts.TypeAliasDeclaration,
            replacer,
            models,
            nsName,options.generator.config.useType
          )
        );
        break;

      case ts.SyntaxKind.ModuleDeclaration:
        promises.push(
          handleModule(child as ts.ModuleDeclaration, replacer, models, nsName, options.generator.config.useType)
        );
        break;
    }
  });

  await Promise.all(promises);

  await update();
}
