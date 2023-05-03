import ts from 'typescript';
import type { Declaration } from '../file/reader';
import type { ModelWithRegex } from '../helpers/dmmf';
import { replaceObject } from '../helpers/replace-object';

export async function handleModelPayload(
  typeAlias: ts.TypeAliasDeclaration,
  replacer: Declaration['replacer'],
  model: ModelWithRegex,
  nsName: string,
  mode: 'namespace' | 'type'
) {
  const type = typeAlias.type as ts.TypeLiteralNode;

  if (type.kind !== ts.SyntaxKind.TypeLiteral) {
    throw new Error(`Provided object is not a type literal: ${type.getText()}`);
  }

  const scalarsField = type.members.find((m) => m.name?.getText() === 'scalars');

  // Besides `scalars` field, the `objects` field also exists, but we don't need to handle it
  // because it just contains references to other <model>Payloads that we already change separately
  if (!scalarsField) {
    return;
  }

  const object = ((scalarsField as ts.PropertySignature)?.type as ts.TypeReferenceNode)
    ?.typeArguments?.[0] as ts.TypeLiteralNode;

  if (!object) {
    throw new Error(`Payload scalars could not be resolved: ${type.getText()}`);
  }

  replaceObject(model, object, nsName, replacer, typeAlias.name.getText(), mode);
}
