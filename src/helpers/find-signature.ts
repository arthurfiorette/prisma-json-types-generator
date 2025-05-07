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
  shouldReplaceStrings = true,
  libNamespace = ''
) {
  // Updates should leave optional fields
  if (isUpdateOneType(model)) {
    typeToChange = `${libNamespace}UpdateInput<${typeToChange}>`;
  }

  let result: string | undefined;

  let skipVar: string | undefined;
  for (const skipVariant of PRISMA_SKIP) {
    const hasSkip = signature.indexOf(skipVariant);
    // removes skip from the search
    if (hasSkip !== -1) {
      signature = (
        signature.slice(0, hasSkip) + signature.slice(hasSkip + skipVariant.length)
      ).trim();
      skipVar = skipVariant;
    }
  }

  switch (signature) {
    //
    // Normal
    //
    case 'JsonValue':
    case 'runtime.JsonValue':
    case 'Prisma.JsonValue':
    case 'InputJsonValue':
    case 'InputJsonValue | InputJsonValue':
    case 'Prisma.JsonNullValueInput | runtime.InputJsonValue':
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

      result = `${libNamespace}TypedStringFilter<${typeToChange}> | ${typeToChange}`;
      break;

    case `StringNullableFilter<"${model}"> | string | null`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `${libNamespace}TypedStringNullableFilter<${typeToChange}> | ${typeToChange} | null`;
      break;

    case `StringNullableListFilter<"${model}">`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `${libNamespace}TypedStringNullableListFilter<${typeToChange}>`;
      break;

    case `StringWithAggregatesFilter<"${model}"> | string`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `${libNamespace}TypedStringWithAggregatesFilter<${typeToChange}> | ${typeToChange}`;
      break;

    case `StringNullableWithAggregatesFilter<"${model}"> | string | null`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `${libNamespace}TypedStringNullableWithAggregatesFilter<${typeToChange}> | ${typeToChange}`;
      break;

    case 'StringFieldUpdateOperationsInput | string':
      if (!shouldReplaceStrings) {
        break;
      }

      result = `${libNamespace}TypedStringFieldUpdateOperationsInput<${typeToChange}> | ${typeToChange}`;
      break;

    case 'NullableStringFieldUpdateOperationsInput | string | null':
      if (!shouldReplaceStrings) {
        break;
      }

      result = `${libNamespace}TypedNullableStringFieldUpdateOperationsInput<${typeToChange}> | ${typeToChange} | null`;
      break;

    case `${model}Create${field}Input | string[]`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `${libNamespace}CreateStringArrayInput<${typeToChange}> | ${typeToChange}[]`;
      break;

    case `${model}Update${field}Input | string[]`:
      if (!shouldReplaceStrings) {
        break;
      }

      result = `${libNamespace}CreateStringArrayInput<${typeToChange}> | ${typeToChange}[]`;
      break;

    //
    // Nullable
    //
    case 'JsonValue | null':
    case 'runtime.JsonValue | null':
    case 'Prisma.JsonValue | null':
    case 'InputJsonValue | null':
    case 'InputJsonValue | InputJsonValue | null':
      result = `${typeToChange} | null`;
      break;

    case 'NullableJsonNullValueInput | InputJsonValue':
    case 'Prisma.NullableJsonNullValueInput | runtime.InputJsonValue':
      // differentiates null in column or a json null value
      result = `${typeToChange} | ${signature.startsWith('Prisma.') ? 'Prisma.' : ''}NullableJsonNullValueInput`;
      break;

    // Super complex type that strictly typing will lose functionality
    case `JsonNullableWithAggregatesFilter<"${model}">`:
    case `JsonNullableFilter<"${model}">`:
      break;

    //
    // Array
    //
    case 'runtime.JsonValue[]':
    case 'Prisma.JsonValue[]':
    case 'JsonValue[]':
    case 'InputJsonValue[]':
    case `Prisma.${model}CreatelistInput | runtime.InputJsonValue[]`:
    case `${model}CreatelistInput | InputJsonValue[]`:
      result = `${typeToChange}[]`;
      break;

    case `Prisma.JsonNullableListFilter<"${model}">`:
    case `JsonNullableListFilter<"${model}">`:
      result = `${libNamespace}NullableListFilter<${typeToChange}>`;
      break;

    case `Prisma.${model}Update${field}Input | runtime.InputJsonValue[]`:
    case `${model}Update${field}Input | InputJsonValue[]`:
      result = `${libNamespace}UpdateManyInput<${typeToChange}>`;
      break;

    case `Prisma.${model}Create${field}Input | runtime.InputJsonValue[]`:
    case `${model}Create${field}Input | InputJsonValue[]`:
      result = `${libNamespace}CreateManyInput<${typeToChange}>`;
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
  if (result && skipVar) {
    result += skipVar;
  }

  return result;
}
