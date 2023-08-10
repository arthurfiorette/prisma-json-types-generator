import type ts from 'typescript';
import type { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import type { ModelWithRegex } from './dmmf';
import { replaceSignature } from './handle-signature';
import { JSON_REGEX } from './regex';

/** Replaces the signature of a typed object. */
export function replaceObject(
  model: ModelWithRegex,
  object: ts.TypeLiteralNode,
  nsName: string,
  writer: DeclarationWriter,
  typeAliasName: string,
  useType?: string
) {
  const fields = model.fields.filter((f) => f.documentation?.match(JSON_REGEX));

  for (const member of object.members) {
    for (const field of fields) {
      const fieldName = member.name?.getText();

      if (fieldName !== field.name) {
        continue;
      }

      const typename = field.documentation?.match(JSON_REGEX)?.[1];
      const signatureType = (member as ts.PropertySignature).type;

      if (!typename || !signatureType) {
        throw new PrismaJsonTypesGeneratorError(
          `Could not find typename or signature type`,
          { type: field.name }
        );
      }

      replaceSignature(
        signatureType,
        typename,
        nsName,
        writer,
        fieldName,
        model.name,
        typeAliasName,
        useType
      );
    }
  }
}
