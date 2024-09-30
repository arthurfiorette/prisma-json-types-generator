import ts from 'typescript';
import type { PrismaEntity } from '../helpers/dmmf';
import { PrismaJsonTypesGeneratorConfig } from '../util/config';
import { DeclarationWriter } from '../util/declaration-writer';
import { handleModelPayload } from './model-payload';
import { replaceObject } from './replace-object';

/**
 * Handles a Prisma namespace statement, can be a model type, a model payload or a model
 * where/create/update input/output
 */
export function handleStatement(
  statement: ts.Statement,
  writer: DeclarationWriter,
  models: PrismaEntity[],
  config: PrismaJsonTypesGeneratorConfig
) {
  if (statement.kind !== ts.SyntaxKind.TypeAliasDeclaration) {
    return;
  }

  const type = statement as ts.TypeAliasDeclaration;

  // Filters any statement that isn't a export type declaration
  if (type.type.kind !== ts.SyntaxKind.TypeLiteral) {
    return;
  }

  const name = type.name.getText();

  // Goes through each model and checks if the type name matches any of the regexps
  for (const model of models) {
    // If this is the main model payload type
    if (name === `$${model.name}Payload`) {
      return handleModelPayload(type, writer, model, config);
    }

    // If this statement matches some create/update/where input/output type
    for (const regexp of model.regexps) {
      if (regexp.test(name)) {
        return replaceObject(type.type as ts.TypeLiteralNode, writer, model, config);
      }
    }

    // No model found for this statement, just ignore this type.
  }
}
