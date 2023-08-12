import ts from 'typescript';
import type { ModelWithRegex } from '../helpers/dmmf';
import { PrismaJsonTypesGeneratorConfig } from '../util/config';
import { PRISMA_NAMESPACE_NAME } from '../util/constants';
import { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import { handleStatement } from './statement';

/** Handles the prisma namespace module. */
export function handlePrismaModule(
  child: ts.ModuleDeclaration,
  writer: DeclarationWriter,
  models: ModelWithRegex[],
  config: PrismaJsonTypesGeneratorConfig
) {
  const name = child
    .getChildren()
    .find((n): n is ts.Identifier => n.kind === ts.SyntaxKind.Identifier);

  // Not a prisma namespace
  if (!name || name.text !== PRISMA_NAMESPACE_NAME) {
    return;
  }

  const content = child
    .getChildren()
    .find((n): n is ts.ModuleBlock => n.kind === ts.SyntaxKind.ModuleBlock);

  if (!content || !content.statements.length) {
    throw new PrismaJsonTypesGeneratorError(
      'Prisma namespace content could not be found'
    );
  }

  // Loops through all statements in the prisma namespace
  for (const statement of content.statements) {
    try {
      handleStatement(statement, writer, models, config);
    } catch (error) {
      // This allows some types to be generated even if others may fail
      // which is good for incremental development/testing
      if (error instanceof PrismaJsonTypesGeneratorError) {
        return PrismaJsonTypesGeneratorError.handler(error);
      }

      // Stops this generator is error thrown is not manually added by our code.
      throw error;
    }
  }
}
