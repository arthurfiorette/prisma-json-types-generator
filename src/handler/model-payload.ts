import type { TSTypeLiteral } from 'oxc-parser';
import type { PrismaEntity } from '../helpers/dmmf';
import { getIdentifierName, getText } from '../util/ast';
import type { PrismaJsonTypesGeneratorConfig } from '../util/config';
import type { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import { replaceObject } from './replace-object';

/** Replacer responsible for the main <Model>Payload type. */
export function handleModelPayload(
  type: TSTypeLiteral,
  writer: DeclarationWriter,
  model: PrismaEntity,
  config: PrismaJsonTypesGeneratorConfig
) {
  const scalarsField = type.members.find(
    (m) => m.type === 'TSPropertySignature' && getIdentifierName(m.key, m.computed) === 'scalars'
  );

  // Currently, there are 4 possible fields in the <model>Payload type:
  // - `scalars` field, which is what we mainly change
  // - `objects` are just references to other fields in which we change separately
  // - `name` and `composites` we do not have to change
  if (scalarsField?.type !== 'TSPropertySignature') {
    return;
  }

  // Gets the inner object type we should change.
  // scalars format is: $Extensions.GetResult<OBJECT, ExtArgs["result"]["user"]>
  // this is the OBJECT part
  const scalars = scalarsField.typeAnnotation?.typeAnnotation;
  const object =
    model.type === 'model'
      ? scalars?.type === 'TSTypeReference'
        ? scalars.typeArguments?.params[0]
        : undefined
      : scalars;

  if (object?.type !== 'TSTypeLiteral') {
    throw new PrismaJsonTypesGeneratorError('Payload scalars could not be resolved', {
      type: getText(writer.content, type)
    });
  }

  // Replaces this object
  return replaceObject(object, writer, model, config);
}
