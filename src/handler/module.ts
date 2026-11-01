import type { TSModuleDeclaration } from 'oxc-parser';
import { Result } from 'try';
import type { PrismaEntity } from '../helpers/dmmf';
import type { PrismaJsonTypesGeneratorConfig } from '../util/config';
import { PRISMA_NAMESPACE_NAME } from '../util/constants';
import type { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import { handleStatement } from './statement';

/** Handles the prisma namespace module. */
export function handlePrismaModule(
  child: TSModuleDeclaration,
  writer: DeclarationWriter,
  modelMap: Map<string, PrismaEntity>,
  knownNoOps: Set<string>,
  typeToNameMap: Map<string, string>,
  config: PrismaJsonTypesGeneratorConfig
) {
  // Not a prisma namespace
  if (child.id.type !== 'Identifier' || child.id.name !== PRISMA_NAMESPACE_NAME) {
    return;
  }

  if (!child.body?.body.length) {
    throw new PrismaJsonTypesGeneratorError('Prisma namespace content could not be found');
  }

  // Loops through all statements in the prisma namespace
  for (const statement of child.body.body) {
    const { ok, error } = Result.try(() =>
      handleStatement(statement, writer, modelMap, typeToNameMap, knownNoOps, config)
    );

    if (ok) {
      continue;
    }

    // This allows some types to be generated even if others may fail
    // which is good for incremental development/testing
    if (error instanceof PrismaJsonTypesGeneratorError) {
      // TODO: Better handler? investigate how to handle errors in the best way.
      console.error(error);
      continue;
    }

    // Stops this generator is error thrown is not manually added by our code.
    throw error;
  }
}
