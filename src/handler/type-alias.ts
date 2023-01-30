import ts from 'typescript';
import type { Declaration } from '../file/reader';
import type { ModelWithRegex } from '../helpers/dmmf';
import { replaceObject } from '../helpers/replace-object';
import { handleModelPayload } from './model-payload';

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
    const modelPayload = models.find((m) => `${m.name}Payload` === name);

    if (modelPayload) {
      return handleModelPayload(typeAlias, replacer, modelPayload, nsName);
    }

    return;
  }

  const object = typeAlias.type as ts.TypeLiteralNode;

  // not a type literal. TODO: there is a way of this happen?
  if (object.kind !== ts.SyntaxKind.TypeLiteral) {
    // For `model`Payload types. They were handled in `handleModelPayload` call
    if (object.kind === ts.SyntaxKind.IndexedAccessType) {
      return;
    }

    throw new Error(`Provided object is not a type literal: ${object.getText()}`);
  }

  replaceObject(model, object, nsName, replacer, typeAlias.name.getText());
}
