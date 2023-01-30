import ts from 'typescript';
import type { Declaration } from '../file/reader';
import type { ModelWithRegex } from '../helpers/dmmf';
import { replaceObject } from '../helpers/replace-object';

export async function handleModelPayload(
  typeAlias: ts.TypeAliasDeclaration,
  replacer: Declaration['replacer'],
  model: ModelWithRegex,
  nsName: string
) {
  const type = typeAlias.type as ts.TypeLiteralNode;

  if (type.kind !== ts.SyntaxKind.TypeLiteral) {
    throw new Error(`Provided object is not a type literal: ${type.getText()}`);
  }

  const scalarsField = type.members.find((m) => m.name?.getText() === 'scalars');

  if (scalarsField) {
    const object = ((scalarsField as ts.PropertySignature)?.type as ts.TypeReferenceNode)
      ?.typeArguments?.[0] as ts.TypeLiteralNode;

    if (!object) {
      throw new Error(`Payload scalars could not be resolved: ${type.getText()}`);
    }

    replaceObject(model, object, nsName, replacer, typeAlias.name.getText());
  }

  const objectsField = type.members.find((m) => m.name?.getText() === 'objects');

  // TODO: Implement objects field
  if (objectsField) {
    const members = ((objectsField as ts.PropertySignature)?.type as ts.TypeLiteralNode)
      ?.members;

    if (members?.length) {
      console.log(
        `You had an object fields, but they aren't supported yet.\nCan you open a issue at https://github.com/arthurfiorette/prisma-json-types-generator?\n`,
        {
          model,
          typeAlias: typeAlias.getText()
        }
      );
    }
  }
}
