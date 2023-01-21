import type ts from 'typescript';
import type { Declaration } from '../file/reader';
import { regexForPrismaUpdateType } from './regex';

/**
 * Handles and replaces the signature of a typed field.
 */
export function replaceSignature(
  signatureType: ts.TypeNode,
  typename: string,
  nsName: string,
  replacer: Declaration['replacer'],
  fieldName: string,
  modelName: string,
  typeAliasName: string
) {
  let name = `${nsName}.${typename}`;

  // Updates should leave optional fields
  if (regexForPrismaUpdateType(modelName).some((r) => r.test(typeAliasName))) {
    name = `Update<${name}>`;
  }

  switch (signatureType.getText()) {
    //
    // Normal
    //
    case 'JsonValue':
    case 'Prisma.JsonValue':
    case 'InputJsonValue':
    case 'InputJsonValue | InputJsonValue':
    case 'JsonNullValueInput | InputJsonValue':
      replacer(signatureType.pos, signatureType.end, name);
      break;

    // Super complex type that strictly typing will lose functionality
    case 'JsonWithAggregatesFilter':
      break;

    // Super complex type that strictly typing will lose functionality
    case 'JsonFilter':
      break;

    //
    // Nullable
    //
    case 'JsonValue | null':
    case 'Prisma.JsonValue | null':
      replacer(signatureType.pos, signatureType.end, `${name} | null`);
      break;

    // differentiates null in column or a json null value
    case 'NullableJsonNullValueInput | InputJsonValue':
      replacer(
        signatureType.pos,
        signatureType.end,
        `${name} | NullableJsonNullValueInput`
      );
      break;

    // Super complex type that strictly typing will lose functionality
    case 'JsonNullableWithAggregatesFilter':
      break;

    // Super complex type that strictly typing will lose functionality
    case 'JsonNullableFilter':
      break;

    //
    // Array
    //
    case 'Prisma.JsonValue[]':
    case 'JsonValue[]':
    case 'Enumerable<InputJsonValue>':
      replacer(signatureType.pos, signatureType.end, `${name}[]`);
      break;

    case 'JsonNullableListFilter':
      replacer(signatureType.pos, signatureType.end, `NullableListFilter<${name}>`);
      break;

    case `${modelName}Update${fieldName}Input | Enumerable<InputJsonValue>`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `UpdateInput<${name}> | Enumerable<${name}>`
      );
      break;

    case `${modelName}Create${fieldName}Input | Enumerable<InputJsonValue>`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `CreateInput<${name}> | Enumerable<${name}>`
      );
      break;

    default:
      console.log(
        `Type (${signatureType.getText()}) at ${typeAliasName}.${fieldName} is not supported.`
      );
  }
}
