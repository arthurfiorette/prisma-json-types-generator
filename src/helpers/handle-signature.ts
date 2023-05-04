import type ts from 'typescript';
import type { Declaration } from '../file/reader';
import { isUpdateOne } from './regex';

/** Handles and replaces the signature of a typed field. */
export function replaceSignature(
  signatureType: ts.TypeNode,
  typename: string,
  nsName: string,
  replacer: Declaration['replacer'],
  fieldName: string,
  modelName: string,
  typeAliasName: string,
  useType?: string
) {
  let name = useType
    ? `${nsName}.${useType}["${typename}"]`
    : `${nsName}.${typename}`;

  // Updates should leave optional fields
  if (isUpdateOne(modelName)) {
    name = `UpdateInput<${name}>`;
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
    // String
    //
    case 'string':
      replacer(signatureType.pos, signatureType.end, name);
      break;

    case 'string[]':
      replacer(signatureType.pos, signatureType.end, `(${name})[]`);
      break;

    case 'string | null':
      replacer(signatureType.pos, signatureType.end, name);
      break;

    case `StringFilter | string`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `TypedStringFilter<${name}> | ${name}`
      );
      break;

    case `StringNullableFilter | string | null`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `TypedStringNullableFilter<${name}> | ${name} | null`
      );
      break;

    case `StringNullableListFilter`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `TypedStringNullableListFilter<${name}>`
      );
      break;

    case `StringWithAggregatesFilter | string`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `TypedStringWithAggregatesFilter<${name}> | ${name}`
      );
      break;

    case `StringNullableWithAggregatesFilter | string | null`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `TypedStringNullableWithAggregatesFilter<${name}> | ${name}`
      );
      break;

    case `StringFieldUpdateOperationsInput | string`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `TypedStringFieldUpdateOperationsInput<${name}> | ${name}`
      );
      break;

    case `NullableStringFieldUpdateOperationsInput | string | null`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `TypedNullableStringFieldUpdateOperationsInput<${name}> | ${name} | null`
      );
      break;

    case `${modelName}Create${fieldName}Input | Enumerable<string>`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `CreateStringArrayInput<${name}> | Enumerable<${name}>`
      );
      break;

    case `${modelName}Update${fieldName}Input | Enumerable<string>`:
      replacer(
        signatureType.pos,
        signatureType.end,
        `CreateStringArrayInput<${name}> | Enumerable<${name}>`
      );
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
      replacer(signatureType.pos, signatureType.end, `${name}[]`);
      break;

    case 'Enumerable<InputJsonValue>':
      replacer(signatureType.pos, signatureType.end, `Enumerable<${name}>`);
      break;

    case 'JsonNullableListFilter':
      replacer(signatureType.pos, signatureType.end, `NullableListFilter<${name}>`);
      break;

    case `${modelName}Update${fieldName}Input | Enumerable<InputJsonValue>`:
      replacer(signatureType.pos, signatureType.end, `UpdateManyInput<${name}>`);
      break;

    case `${modelName}Create${fieldName}Input | Enumerable<InputJsonValue>`:
      replacer(signatureType.pos, signatureType.end, `CreateManyInput<${name}>`);
      break;

    default:
      console.log(
        `\x1b[90m✘\x1b[0m Type \x1b[1m${typeAliasName}.${fieldName}\x1b[0m is not supported.`
      );
  }
}
