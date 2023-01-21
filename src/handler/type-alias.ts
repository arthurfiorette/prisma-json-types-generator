import { logger } from '@prisma/sdk';
import ts from 'typescript';
import type { Declaration } from '../file/reader';
import type { ModelWithRegex } from '../helpers/dmmf';
import { JSON_REGEX } from '../helpers/regex';
import { replaceSignature } from '../helpers/handle-signature';

export async function handleTypeAlias(
  typeAlias: ts.TypeAliasDeclaration,
  replacer: Declaration['replacer'],
  models: ModelWithRegex[],
  nsName: string
) {
  // enum declarations
  if (typeAlias.getChildAt(4)?.getText().startsWith('(typeof')) {
    return;
  }

  const name = typeAlias.name.getText();
  const model = models.find((m) => m.name === name);

  // not a model with typed json fields
  if (!model) {
    return;
  }

  const fields = model.fields.filter((f) => f.documentation?.match(JSON_REGEX));

  const object = typeAlias.type as ts.TypeLiteralNode;

  // not a type literal. TODO: there is a way of this happen?
  if (object.kind !== ts.SyntaxKind.TypeLiteral) {
    logger.error(`Provided object is not a type literal: ${object.getText()}`);
    return;
  }

  for (const member of object.members) {
    for (const field of fields) {
      const fieldName = member.name?.getText();

      if (fieldName !== field.name) {
        continue;
      }

      const typename = field.documentation?.match(JSON_REGEX)?.[1];

      const signatureType = (member as ts.PropertySignature).type;

      if (!typename || !signatureType) {
        throw new Error(
          `Could not find typename or signature type for ${field.name} at `
        );
      }

      replaceSignature(
        signatureType,
        typename,
        nsName,
        replacer,
        fieldName,
        model.name,
        typeAlias.name.getText()
      );
    }
  }
}
