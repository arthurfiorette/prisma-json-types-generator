import type { Directive, Statement } from 'oxc-parser';
import type { PrismaEntity } from '../helpers/dmmf';
import { extractBaseNameFromRelationType } from '../helpers/regex';
import { unwrapExport } from '../util/ast';
import type { PrismaJsonTypesGeneratorConfig } from '../util/config';
import type { DeclarationWriter } from '../util/declaration-writer';
import { handleModelPayload } from './model-payload';
import { replaceObject } from './replace-object';

/**
 * Handles a Prisma namespace statement, can be a model type, a model payload or a model
 * where/create/update input/output
 */
export function handleStatement(
  statement: Directive | Statement,
  writer: DeclarationWriter,
  modelMap: Map<string, PrismaEntity>,
  typeToNameMap: Map<string, string>,
  knownNoOps: Set<string>,
  config: PrismaJsonTypesGeneratorConfig
) {
  const type = unwrapExport(statement);

  if (type?.type !== 'TSTypeAliasDeclaration') {
    return;
  }

  // Filters any statement that isn't a export type declaration
  if (type.typeAnnotation.type !== 'TSTypeLiteral') {
    return;
  }

  const typeName = type.id.name;

  // Skip the type if it belongs to a model without Json or a type comment
  if (knownNoOps.has(typeName)) {
    return;
  }

  const modelName = typeToNameMap.get(typeName);
  // Extract the name of the model from the type name
  if (modelName) {
    const model = modelMap.get(modelName);
    if (model) {
      if (typeName === `$${modelName}Payload`) {
        return handleModelPayload(type.typeAnnotation, writer, model, config);
      }
      return replaceObject(type.typeAnnotation, writer, model, config);
    }
  } else {
    // If the type name isn't constant, match the model name using a regex, then do the lookup
    const baseName = extractBaseNameFromRelationType(typeName);
    if (baseName) {
      const model = modelMap.get(baseName);
      if (model) {
        return replaceObject(type.typeAnnotation, writer, model, config);
      }
    }
  }
}
