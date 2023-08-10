import ts from 'typescript';
import type { ModelWithRegex } from '../helpers/dmmf';
import { replaceSignature } from '../helpers/handle-signature';
import { JSON_REGEX } from '../helpers/regex';
import { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import { handleModelPayload } from './model-payload';

export function handleModule(
  module: ts.ModuleDeclaration,
  writer: DeclarationWriter,
  models: ModelWithRegex[],
  nsName: string,
  useType?: string
) {
  const namespace = module
    .getChildren()
    .find((n): n is ts.ModuleBlock => n.kind === ts.SyntaxKind.ModuleBlock);

  if (!namespace) {
    throw new PrismaJsonTypesGeneratorError('Prisma namespace could not be found');
  }

  for (const statement of namespace.statements) {
    const type = statement as ts.TypeAliasDeclaration;

    // Filters any statement that isn't a export type declaration
    if (
      statement.kind !== ts.SyntaxKind.TypeAliasDeclaration ||
      type.type.kind !== ts.SyntaxKind.TypeLiteral
    ) {
      console.debug(`Statement is not a type alias declaration`, statement.getText())
      continue;
    }

    const typeName = type.name.getText();

    // First, finds the $<MODEL>Payload type, the main model type.
    let model = models.find((m) => typeName === `$${m.name}Payload`);

    if (model) {
      console.debug(`Payload Model found for type ${typeName}`)
      return handleModelPayload(type, writer, model, nsName, useType);
    }

    // Tries to find any <MODEL>Update/Create/WhereInput/Output types
    model = models.find((m) => m.regexps.some((r) => r.test(typeName)));

    // No model found, just ignore this type.
    if (!model) {
      console.debug(`Model not found for type ${typeName}`)
      continue;
    } else {
      console.debug(`Model found for type ${typeName}`)
    }

    // TODO: https://github.com/arthurfiorette/prisma-json-types-generator/issues/112
    const fields = model.fields.filter((f) => f.documentation?.match(JSON_REGEX));
    const typeOfType = type.type as ts.TypeLiteralNode;

    for (const member of typeOfType.members) {
      // Filters any member that isn't a property signature
      // Unusual, but it can happen. to have non-property signatures in a type literal.
      if (member.kind !== ts.SyntaxKind.PropertySignature) {
        console.debug(`Member kind is not a property signature`)
        continue;
      }

      const signature = member as ts.PropertySignature;

      const fieldName = member.name?.getText();
      const field = fields.find((f) => f.name === fieldName);

      if (!field || !fieldName) {
        console.debug(`Field ${fieldName} not found in model ${typeName}`)
        continue;
      }

      if (!signature.type) {
        throw new PrismaJsonTypesGeneratorError(
          `No type found for field ${fieldName} at model ${typeName}`
        );
      }

      const typename = field.documentation?.match(JSON_REGEX)?.[1];

      if (!typename) {
        throw new PrismaJsonTypesGeneratorError(
          `No typename found for field ${fieldName} at model ${typeName}`
        );
      }

      replaceSignature(
        signature.type,
        typename,
        nsName,
        writer,
        fieldName,
        model.name,
        typeName,
        useType
      );
    }
  }
}
