import type ts from 'typescript';
import type { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import { isUpdateOneType } from './regex';

/** Handles and replaces the signature of a typed field. */
export function replaceSignature(
  signatureType: ts.TypeNode,
  typename: string,
  nsName: string,
  writer: DeclarationWriter,
  fieldName: string,
  modelName: string,
  typeAliasName: string,
  useType?: string
) {
  let name = useType ? `${nsName}.${useType}["${typename}"]` : `${nsName}.${typename}`;

  // Updates should leave optional fields
  if (isUpdateOneType(modelName)) {
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
      writer.replace(signatureType.pos, signatureType.end, name);

      break;

    // Super complex type that strictly typing will lose functionality
    case `JsonWithAggregatesFilter<"${modelName}">`:
      break;

    // Super complex type that strictly typing will lose functionality
    case `JsonFilter<"${modelName}">`:
      break;

    //
    // String
    //
    case 'string':
      writer.replace(signatureType.pos, signatureType.end, name);
      break;

    case 'string[]':
      writer.replace(signatureType.pos, signatureType.end, `(${name})[]`);
      break;

    case 'string | null':
      writer.replace(signatureType.pos, signatureType.end, name);
      break;

    case `StringFilter<"${modelName}"> | string`:
      writer.replace(
        signatureType.pos,
        signatureType.end,
        `TypedStringFilter<${name}> | ${name}`
      );
      break;

    case `StringNullableFilter<"${modelName}"> | string | null`:
      writer.replace(
        signatureType.pos,
        signatureType.end,
        `TypedStringNullableFilter<${name}> | ${name} | null`
      );
      break;

    case `StringNullableListFilter<"${modelName}">`:
      writer.replace(
        signatureType.pos,
        signatureType.end,
        `TypedStringNullableListFilter<${name}>`
      );
      break;

    case `StringWithAggregatesFilter<"${modelName}"> | string`:
      writer.replace(
        signatureType.pos,
        signatureType.end,
        `TypedStringWithAggregatesFilter<${name}> | ${name}`
      );
      break;

    case `StringNullableWithAggregatesFilter<"${modelName}"> | string | null`:
      writer.replace(
        signatureType.pos,
        signatureType.end,
        `TypedStringNullableWithAggregatesFilter<${name}> | ${name}`
      );
      break;

    case `StringFieldUpdateOperationsInput | string`:
      writer.replace(
        signatureType.pos,
        signatureType.end,
        `TypedStringFieldUpdateOperationsInput<${name}> | ${name}`
      );
      break;

    case `NullableStringFieldUpdateOperationsInput | string | null`:
      writer.replace(
        signatureType.pos,
        signatureType.end,
        `TypedNullableStringFieldUpdateOperationsInput<${name}> | ${name} | null`
      );
      break;

    case `${modelName}Create${fieldName}Input | string[]`:
      writer.replace(
        signatureType.pos,
        signatureType.end,
        `CreateStringArrayInput<${name}> | ${name}[]`
      );
      break;

    case `${modelName}Update${fieldName}Input | string[]`:
      writer.replace(
        signatureType.pos,
        signatureType.end,
        `CreateStringArrayInput<${name}> | ${name}[]`
      );
      break;

    //
    // Nullable
    //
    case 'JsonValue | null':
    case 'Prisma.JsonValue | null':
      writer.replace(signatureType.pos, signatureType.end, `${name} | null`);
      break;

    // differentiates null in column or a json null value
    case 'JsonNullValueInput | InputJsonValue':
    case 'NullableJsonNullValueInput | InputJsonValue':
      writer.replace(
        signatureType.pos,
        signatureType.end,
        `${name} | NullableJsonNullValueInput`
      );
      break;

    // Super complex type that strictly typing will lose functionality
    case `JsonNullableWithAggregatesFilter<"${modelName}">`:
      break;

    // Super complex type that strictly typing will lose functionality
    case `JsonNullableFilter<"${modelName}">`:
      break;

    //
    // Array
    //
    case 'Prisma.JsonValue[]':
    case 'JsonValue[]':
      writer.replace(signatureType.pos, signatureType.end, `${name}[]`);
      break;

    case 'Enumerable<InputJsonValue>':
      writer.replace(signatureType.pos, signatureType.end, `Enumerable<${name}>`);
      break;

    case `JsonNullableListFilter<"${modelName}">`:
      writer.replace(signatureType.pos, signatureType.end, `NullableListFilter<${name}>`);
      break;

    case `${modelName}Update${fieldName}Input | InputJsonValue[]`:
      writer.replace(signatureType.pos, signatureType.end, `UpdateManyInput<${name}>`);
      break;

    case `${modelName}Create${fieldName}Input | InputJsonValue[]`:
      writer.replace(signatureType.pos, signatureType.end, `CreateManyInput<${name}>`);
      break;

    default:
      throw new PrismaJsonTypesGeneratorError('Found unsupported required field type', {
        typeAliasName,
        fieldName,
        signatureType: signatureType.getText()
      });
  }
}
