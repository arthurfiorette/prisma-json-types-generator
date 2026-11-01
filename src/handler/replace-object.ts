import type { TSTypeLiteral } from 'oxc-parser';
import type { PrismaEntity } from '../helpers/dmmf';
import { findNewSignature } from '../helpers/find-signature';
import { parseTypeSyntax } from '../helpers/type-parser';
import { getIdentifierName, getText } from '../util/ast';
import type { PrismaJsonTypesGeneratorConfig } from '../util/config';
import { createType } from '../util/create-signature';
import type { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';

/** Tries to replace every property of an object */
export function replaceObject(
  object: TSTypeLiteral,
  writer: DeclarationWriter,
  model: PrismaEntity,
  config: PrismaJsonTypesGeneratorConfig
) {
  for (const field of model.fields) {
    const parsed = parseTypeSyntax(field.documentation);

    // Not annotated with JSON comment and we should let it be any
    if (!parsed && config.allowAny) {
      continue;
    }

    for (const member of object.members) {
      if (
        // Not sure when a object member cannot be a PropertySignature,
        // here to avoid errors
        member.type !== 'TSPropertySignature' ||
        // The field name does not match the member name
        field.name !== getIdentifierName(member.key, member.computed)
      ) {
        continue;
      }

      // the original `field: Type`
      const signature = member.typeAnnotation?.typeAnnotation;

      if (!signature) {
        throw new PrismaJsonTypesGeneratorError('Could not find signature type', {
          type: field.name
        });
      }

      const newType = createType(field.documentation, config);

      // If the created type was defaulted to unknown because no other type annotation was provided
      const defaultedToUnknown = newType === 'unknown';

      const newSignature = findNewSignature(
        getText(writer.content, signature),
        // Updates the typename according to the config
        newType,
        model.name,
        field.name,
        // We must ignore not found errors when no typename was found but we still
        // are replacing because of allowAny = false
        !defaultedToUnknown,
        !defaultedToUnknown,
        writer.multifile ? 'PJTG.' : ''
      );

      // This type should be ignored by the generator
      if (!newSignature) {
        continue;
      }

      // Replaces the signature with the new one
      writer.replace(signature.start, signature.end, newSignature);
    }
  }
}
