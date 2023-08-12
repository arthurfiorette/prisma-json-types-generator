import ts from 'typescript';
import type { ModelWithRegex } from '../helpers/dmmf';
import { findNewSignature } from '../helpers/find-signature';
import { JSON_REGEX } from '../helpers/regex';
import { PrismaJsonTypesGeneratorConfig } from '../util/config';
import type { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import { createType } from '../util/create-signature';

/** Tries to replace every property of an object */
export function replaceObject(
  object: ts.TypeLiteralNode,
  writer: DeclarationWriter,
  model: ModelWithRegex,
  config: PrismaJsonTypesGeneratorConfig
) {
  for (const field of model.fields) {
    const match = field.documentation?.match(JSON_REGEX);

    // Not annotated with JSON comment, or we should let it be any
    if (!match && config.allowAny) {
      continue;
    }

    for (const member of object.members) {
      const memberName = member.name?.getText();

      if (
        // Not sure when a object member cannot be a PropertySignature,
        // here to avoid errors
        member.kind !== ts.SyntaxKind.PropertySignature ||
        // The field name does not match the member name
        field.name !== memberName
      ) {
        continue;
      }

      // the original `field: Type`
      const signature = (member as ts.PropertySignature).type;

      if (!signature) {
        throw new PrismaJsonTypesGeneratorError(`Could not find signature type`, {
          type: field.name
        });
      }

      const newType = createType(field.documentation, config)

      const newSignature = findNewSignature(
        signature.getText(),
        // Updates the typename according to the config
        newType,
        model.name,
        field.name,
        // We must ignore not found errors when no typename was found but we still
        // are replacing because of allowAny = false
        newType !== 'unknown'
      );

      // This type should be ignored by the generator
      if (!newSignature) {
        continue;
      }

      // Replaces the signature with the new one
      writer.replace(signature.pos, signature.end, newSignature);
    }
  }
}
