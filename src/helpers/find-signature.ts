import { PrismaJsonTypesGeneratorError } from '../util/error';
import { isUpdateOneType } from './regex';

/** Handles and replaces the signature of a typed field. */
export function findNewSignature(
  signature: string,
  typeToChange: string,
  model: string,
  field: string,
  throwOnNotFound = true
) {
  // Updates should leave optional fields
  if (isUpdateOneType(model)) {
    typeToChange = `UpdateInput<${typeToChange}>`;
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
      return typeToChange;

    // Super complex type that strictly typing will lose functionality
    case `JsonWithAggregatesFilter<"${model}">`:
    case `JsonFilter<"${model}">`:
      return undefined;

    //
    // String
    //
    case 'string':
      return typeToChange;

    case 'string[]':
      return `(${typeToChange})[]`;

    case 'string | null':
      return typeToChange;

    case `StringFilter<"${model}"> | string`:
      return `TypedStringFilter<${typeToChange}> | ${typeToChange}`;

    case `StringNullableFilter<"${model}"> | string | null`:
      return `TypedStringNullableFilter<${typeToChange}> | ${typeToChange} | null`;

    case `StringNullableListFilter<"${model}">`:
      return `TypedStringNullableListFilter<${typeToChange}>`;

    case `StringWithAggregatesFilter<"${model}"> | string`:
      return `TypedStringWithAggregatesFilter<${typeToChange}> | ${typeToChange}`;

    case `StringNullableWithAggregatesFilter<"${model}"> | string | null`:
      return `TypedStringNullableWithAggregatesFilter<${typeToChange}> | ${typeToChange}`;

    case `StringFieldUpdateOperationsInput | string`:
      return `TypedStringFieldUpdateOperationsInput<${typeToChange}> | ${typeToChange}`;

    case `NullableStringFieldUpdateOperationsInput | string | null`:
      return `TypedNullableStringFieldUpdateOperationsInput<${typeToChange}> | ${typeToChange} | null`;

    case `${model}Create${field}Input | string[]`:
      return `CreateStringArrayInput<${typeToChange}> | ${typeToChange}[]`;

    case `${model}Update${field}Input | string[]`:
      return `CreateStringArrayInput<${typeToChange}> | ${typeToChange}[]`;

    //
    // Nullable
    //
    case 'JsonValue | null':
    case 'Prisma.JsonValue | null':
      return `${typeToChange} | null`;

    case 'JsonNullValueInput | InputJsonValue':
    case 'NullableJsonNullValueInput | InputJsonValue':
      // differentiates null in column or a json null value
      return `${typeToChange} | NullableJsonNullValueInput`;

    // Super complex type that strictly typing will lose functionality
    case `JsonNullableWithAggregatesFilter<"${model}">`:
    case `JsonNullableFilter<"${model}">`:
      return undefined;

    //
    // Array
    //
    case 'Prisma.JsonValue[]':
    case 'JsonValue[]':
    case 'InputJsonValue[]':
    case `${model}CreatelistInput | InputJsonValue[]`:
      return `${typeToChange}[]`;

    case `JsonNullableListFilter<"${model}">`:
      return `NullableListFilter<${typeToChange}>`;

    case `${model}Update${field}Input | InputJsonValue[]`:
      return `UpdateManyInput<${typeToChange}>`;

    case `${model}Create${field}Input | InputJsonValue[]`:
      return `CreateManyInput<${typeToChange}>`;

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

      return undefined;
  }
}
