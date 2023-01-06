import { logger } from '@prisma/sdk';
import ts from 'typescript';
import type { Declaration } from '../file/reader';
import type { ModelWithRegex } from '../helpers/dmmf';
import { JSON_REGEX } from '../helpers/regex';

export async function handleTypeAlias(
  type: ts.TypeAliasDeclaration,
  replacer: Declaration['replacer'],
  models: ModelWithRegex[],
  nsName: string
) {
  // enum declarations
  if (type.getChildAt(4)?.getText().startsWith('(typeof')) {
    return;
  }

  const name = type.name.getText();
  const model = models.find((m) => m.name === name);

  // not a model with typed json fields
  if (!model) {
    return;
  }

  const fields = model.fields.filter((f) => f.documentation?.match(JSON_REGEX));

  const object = type.type as ts.TypeLiteralNode;

  // not a type literal. TODO: there is a way of this happen?
  if (object.kind !== ts.SyntaxKind.TypeLiteral) {
    logger.error(`Provided object is not a type literal: ${object.getText()}`);
    return;
  }

  for (const member of object.members) {
    for (const field of fields) {
      if (member.name?.getText() !== field.name) {
        continue;
      }

      const typename = field.documentation?.match(JSON_REGEX)?.[1];

      replacer(
        (member as ts.PropertySignature).type!.pos,
        (member as ts.PropertySignature).type!.end,
        `${nsName}.${typename}`
      );
    }
  }
}
