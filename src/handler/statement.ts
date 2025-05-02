import ts from 'typescript';
import type { PrismaEntity } from '../helpers/dmmf';
import { extractBaseNameFromRelationType } from '../helpers/regex';
import type { PrismaJsonTypesGeneratorConfig } from '../util/config';
import type { DeclarationWriter } from '../util/declaration-writer';
import { handleModelPayload } from './model-payload';
import { replaceObject } from './replace-object';

/**
 * Handles a Prisma namespace statement, can be a model type, a model payload or a model
 * where/create/update input/output
 */
export function handleStatement(
  statement: ts.Statement,
  writer: DeclarationWriter,
  modelMap: Map<string, PrismaEntity>,
  typeToNameMap: Map<string, string>,
  knownNoOps: Set<string>,
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

  // Skip the type if it belongs to a model without Json or a type comment
  if (knownNoOps.has(type.name.getText())) {
    return;
  }

  const typeName = type.name.getText();

  const modelName = typeToNameMap.get(typeName);
  // Extract the name of the model from the type name
  if (modelName) {
    const model = modelMap.get(modelName);
    if (model) {
      if (typeName === `$${modelName}Payload`) {
        return handleModelPayload(type, writer, model, config);
      }
      return replaceObject(type.type as ts.TypeLiteralNode, writer, model, config);
    }
  } else {
    // If the type name isn't constant, match the model name using a regex, then do the lookup
    const baseName = extractBaseNameFromRelationType(typeName);
    if (baseName) {
      const model = modelMap.get(baseName);
      if (model) {
        return replaceObject(type.type as ts.TypeLiteralNode, writer, model, config);
      }
    }
  }
}
