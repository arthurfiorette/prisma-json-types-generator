import ts from 'typescript';
import type { PrismaEntity } from '../helpers/dmmf';
import { PrismaJsonTypesGeneratorConfig } from '../util/config';
import type { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import { replaceObject } from './replace-object';

/** Replacer responsible for the main <Model>Payload type. */
export function handleModelPayload(
  typeAlias: ts.TypeAliasDeclaration,
  writer: DeclarationWriter,
  model: PrismaEntity,
  config: PrismaJsonTypesGeneratorConfig
) {
  const type = typeAlias.type as ts.TypeLiteralNode;

  if (type.kind !== ts.SyntaxKind.TypeLiteral) {
    throw new PrismaJsonTypesGeneratorError(
      'Provided model payload is not a type literal',
      { type: type.getText() }
    );
  }

  const scalarsField: any = type.members.find((m) => m.name?.getText() === 'scalars');

  // Currently, there are 4 possible fields in the <model>Payload type:
  // - `scalars` field, which is what we mainly change
  // - `objects` are just references to other fields in which we change separately
  // - `name` and `composites` we do not have to change
  if (!scalarsField) {
    return;
  }

  // Gets the inner object type we should change.
  // scalars format is: $Extensions.GetResult<OBJECT, ExtArgs["result"]["user"]>
  // this is the OBJECT part
  const object = (
    model.type === 'model' ? scalarsField?.type?.typeArguments?.[0] : scalarsField?.type
  ) as ts.TypeLiteralNode;

  if (!object) {
    throw new PrismaJsonTypesGeneratorError('Payload scalars could not be resolved', {
      type: type.getText()
    });
  }

  // Replaces this object
  return replaceObject(object, writer, model, config);
}
