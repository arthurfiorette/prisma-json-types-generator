import { PRISMA_SKIP } from '../util/constants';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import { isUpdateOneType } from './regex';

/** Handles and replaces the signature of a typed field. */
export function findNewSignature(
  signature: string,
  typeToChange: string,
  model: string,
  field: string,
  throwOnNotFound = true,
  shouldReplaceStrings = true
) {
  // Updates should leave optional fields
  if (isUpdateOneType(model)) {
    typeToChange = `UpdateInput<${typeToChange}>`;
  }

  let result: string | undefined;

  const hasSkip = signature.indexOf(PRISMA_SKIP);

  // removes skip from the search
  if (hasSkip !== -1) {
    signature = (
      signature.slice(0, hasSkip) + signature.slice(hasSkip + PRISMA_SKIP.length)
    ).trim();
  }

  switch (signature) {
    //
    // Normal
    //
    case 'JsonValue':
    case 'Prisma.JsonValue':
    case 'InputJsonValue':
    case 'InputJsonValue | InputJsonValue':
    case 'JsonNullValueInput | InputJsonValue':
      result = typeToChange;
      break;

    // Super complex type that strictly typing will lose functionality
    case `JsonWithAggregatesFilter<"${model}">`:
    case `JsonFilter<"${model}">`:
      break;

    //
    // String
    //
    case 'string':
      if (!shouldReplaceStrings) {
        break;
      }

      result = typeToChange;
      break;

    case 'string[]':
      if (!shouldReplaceStrings) {
        break;
      }

      result = `(${typeToChange})[]`;
      break;

    case 'string | null':
      if (!shouldReplaceStrings) {
        break;
      }

      result = typeToChange;
      break;

    case `StringFilter<"${model}"> | string`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `TypedStringFilter<${typeToChange}> | ${typeToChange}`;
      break;

    case `StringNullableFilter<"${model}"> | string | null`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `TypedStringNullableFilter<${typeToChange}> | ${typeToChange} | null`;
      break;

    case `StringNullableListFilter<"${model}">`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `TypedStringNullableListFilter<${typeToChange}>`;
      break;

    case `StringWithAggregatesFilter<"${model}"> | string`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `TypedStringWithAggregatesFilter<${typeToChange}> | ${typeToChange}`;
      break;

    case `StringNullableWithAggregatesFilter<"${model}"> | string | null`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `TypedStringNullableWithAggregatesFilter<${typeToChange}> | ${typeToChange}`;
      break;

    case 'StringFieldUpdateOperationsInput | string':
      if (!shouldReplaceStrings) {
        break;
      }

      result = `TypedStringFieldUpdateOperationsInput<${typeToChange}> | ${typeToChange}`;
      break;

    case 'NullableStringFieldUpdateOperationsInput | string | null':
      if (!shouldReplaceStrings) {
        break;
      }

      result = `TypedNullableStringFieldUpdateOperationsInput<${typeToChange}> | ${typeToChange} | null`;
      break;

    case `${model}Create${field}Input | string[]`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `CreateStringArrayInput<${typeToChange}> | ${typeToChange}[]`;
      break;

    case `${model}Update${field}Input | string[]`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `CreateStringArrayInput<${typeToChange}> | ${typeToChange}[]`;
      break;

    //
    // Nullable
    //
    case 'JsonValue | null':
    case 'Prisma.JsonValue | null':
    case 'InputJsonValue | null':
    case 'InputJsonValue | InputJsonValue | null':
      result = `${typeToChange} | null`;
      break;

    case 'NullableJsonNullValueInput | InputJsonValue':
      // differentiates null in column or a json null value
      result = `${typeToChange} | NullableJsonNullValueInput`;
      break;

    // Super complex type that strictly typing will lose functionality
    case `JsonNullableWithAggregatesFilter<"${model}">`:
    case `JsonNullableFilter<"${model}">`:
      break;

    //
    // Array
    //
    case 'Prisma.JsonValue[]':
    case 'JsonValue[]':
    case 'InputJsonValue[]':
    case `${model}CreatelistInput | InputJsonValue[]`:
      result = `${typeToChange}[]`;
      break;

    case `JsonNullableListFilter<"${model}">`:
      result = `NullableListFilter<${typeToChange}>`;
      break;

    case `${model}Update${field}Input | InputJsonValue[]`:
      result = `UpdateManyInput<${typeToChange}>`;
      break;

    case `${model}Create${field}Input | InputJsonValue[]`:
      result = `CreateManyInput<${typeToChange}>`;
      break;

    //
    // Unknown types, its safe to throw an error here because each field does not conflict with other fields generation.
    //
    default:
      if (throwOnNotFound) {
        throw new PrismaJsonTypesGeneratorError('Found unsupported required field type', {
          signature,
          typeToChange,
          type: model,
          fieldName: field,
          throwOnNotFound
        });
      }

      break;
  }

  // Add it back later
  if (result && hasSkip !== -1) {
    result += PRISMA_SKIP;
  }

  return result;
}
