import type ts from 'typescript';
import type { Declaration } from '../file/reader';
import type { ModelWithRegex } from './dmmf';
import { replaceSignature } from './handle-signature';
import { JSON_REGEX } from './regex';

export function replaceObject(
  model: ModelWithRegex,
  object: ts.TypeLiteralNode,
  nsName: string,
  replacer: Declaration['replacer'],
  typeAliasName: string,
  mode: 'namespace' | 'type'
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
        throw new Error(`Could not find typename or signature type for ${field.name}`);
      }

      replaceSignature(
        signatureType,
        typename,
        nsName,
        replacer,
        fieldName,
        model.name,
        typeAliasName,
        mode
      );
    }
  }
}
