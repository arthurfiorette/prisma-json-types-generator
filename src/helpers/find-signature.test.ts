import { findNewSignature } from './find-signature';

describe('findNewSignature', () => {
  const typeToChange = 'CustomType';
  const model = 'User';
  const field = 'data';

  describe('when handling normal types', () => {
    it('should return the typeToChange for JsonValue signatures', () => {
      expect(findNewSignature('JsonValue', typeToChange, model, field)).toBe(typeToChange);
      expect(findNewSignature('InputJsonValue', typeToChange, model, field)).toBe(typeToChange);
      expect(findNewSignature('InputJsonValue | InputJsonValue', typeToChange, model, field)).toBe(
        typeToChange
      );
      expect(
        findNewSignature('JsonNullValueInput | InputJsonValue', typeToChange, model, field)
      ).toBe(typeToChange);
    });

    it('should not modify complex filter types', () => {
      expect(
        findNewSignature('JsonWithAggregatesFilter<"User">', typeToChange, model, field)
      ).toBeUndefined();
      expect(findNewSignature('JsonFilter<"User">', typeToChange, model, field)).toBeUndefined();
      expect(
        findNewSignature('IntFilter<"User"> | number', typeToChange, model, field)
      ).toBeUndefined();
      expect(
        findNewSignature('IntWithAggregatesFilter<"User"> | number', typeToChange, model, field)
      ).toBeUndefined();
      expect(
        findNewSignature('FloatFilter<"User"> | number', typeToChange, model, field)
      ).toBeUndefined();
      expect(
        findNewSignature('FloatWithAggregatesFilter<"User"> | number', typeToChange, model, field)
      ).toBeUndefined();
    });
  });

  describe('when handling string types', () => {
    it('should replace string with typeToChange when shouldReplaceStrings is true', () => {
      expect(findNewSignature('string', typeToChange, model, field)).toBe(typeToChange);
      expect(findNewSignature('number', typeToChange, model, field)).toBe(typeToChange);
    });

    it('should not replace string when shouldReplaceStrings is false', () => {
      expect(findNewSignature('string', typeToChange, model, field, true, false)).toBeUndefined();
      expect(findNewSignature('number', typeToChange, model, field, true, false)).toBeUndefined();
    });

    it('should handle array types correctly', () => {
      expect(findNewSignature('string[]', typeToChange, model, field)).toBe(`(${typeToChange})[]`);
      expect(findNewSignature('number[]', typeToChange, model, field)).toBe(`(${typeToChange})[]`);
    });

    it('should handle nullable types correctly', () => {
      expect(findNewSignature('string | null', typeToChange, model, field)).toBe(
        `${typeToChange} | null`
      );
      expect(findNewSignature('number | null', typeToChange, model, field)).toBe(
        `${typeToChange} | null`
      );
    });
  });

  describe('when handling string filter types', () => {
    it('should transform StringFilter to TypedStringFilter', () => {
      const result = findNewSignature('StringFilter<"User"> | string', typeToChange, model, field);
      expect(result).toBe(`TypedStringFilter<${typeToChange}> | ${typeToChange}`);
    });

    it('should transform StringNullableFilter to TypedStringNullableFilter', () => {
      const result = findNewSignature(
        'StringNullableFilter<"User"> | string | null',
        typeToChange,
        model,
        field
      );
      expect(result).toBe(`TypedStringNullableFilter<${typeToChange}> | ${typeToChange} | null`);
    });

    it('should transform StringNullableListFilter to TypedStringNullableListFilter', () => {
      const result = findNewSignature(
        'StringNullableListFilter<"User">',
        typeToChange,
        model,
        field
      );
      expect(result).toBe(`TypedStringNullableListFilter<${typeToChange}>`);
    });

    it('should transform StringWithAggregatesFilter to TypedStringWithAggregatesFilter', () => {
      const result = findNewSignature(
        'StringWithAggregatesFilter<"User"> | string',
        typeToChange,
        model,
        field
      );
      expect(result).toBe(`TypedStringWithAggregatesFilter<${typeToChange}> | ${typeToChange}`);
    });

    it('should transform StringNullableWithAggregatesFilter to TypedStringNullableWithAggregatesFilter', () => {
      const result = findNewSignature(
        'StringNullableWithAggregatesFilter<"User"> | string | null',
        typeToChange,
        model,
        field
      );
      expect(result).toBe(
        `TypedStringNullableWithAggregatesFilter<${typeToChange}> | ${typeToChange}`
      );
    });
  });

  describe('when handling field update operations', () => {
    it('should transform StringFieldUpdateOperationsInput', () => {
      const result = findNewSignature(
        'StringFieldUpdateOperationsInput | string',
        typeToChange,
        model,
        field
      );
      expect(result).toBe(
        `TypedStringFieldUpdateOperationsInput<${typeToChange}> | ${typeToChange}`
      );
    });

    it('should transform IntFieldUpdateOperationsInput and FloatFieldUpdateOperationsInput', () => {
      expect(
        findNewSignature('IntFieldUpdateOperationsInput | number', typeToChange, model, field)
      ).toBe(typeToChange);
      expect(
        findNewSignature('FloatFieldUpdateOperationsInput | number', typeToChange, model, field)
      ).toBe(typeToChange);
    });

    it('should transform NullableStringFieldUpdateOperationsInput', () => {
      const result = findNewSignature(
        'NullableStringFieldUpdateOperationsInput | string | null',
        typeToChange,
        model,
        field
      );
      expect(result).toBe(
        `TypedNullableStringFieldUpdateOperationsInput<${typeToChange}> | ${typeToChange} | null`
      );
    });

    it('should transform nullable numeric field update operations', () => {
      expect(
        findNewSignature(
          'NullableIntFieldUpdateOperationsInput | number | null',
          typeToChange,
          model,
          field
        )
      ).toBe(`${typeToChange} | null`);
      expect(
        findNewSignature(
          'NullableFloatFieldUpdateOperationsInput | number | null',
          typeToChange,
          model,
          field
        )
      ).toBe(`${typeToChange} | null`);
    });
  });

  describe('when handling model-specific types', () => {
    it('should transform model-specific create and update input types', () => {
      expect(findNewSignature('UserCreatedataInput | string[]', typeToChange, model, field)).toBe(
        `CreateStringArrayInput<${typeToChange}> | ${typeToChange}[]`
      );
      expect(findNewSignature('UserCreatedataInput | number[]', typeToChange, model, field)).toBe(
        `CreateStringArrayInput<${typeToChange}> | ${typeToChange}[]`
      );
      expect(findNewSignature('UserUpdatedataInput | string[]', typeToChange, model, field)).toBe(
        `CreateStringArrayInput<${typeToChange}> | ${typeToChange}[]`
      );
      expect(findNewSignature('UserUpdatedataInput | number[]', typeToChange, model, field)).toBe(
        `CreateStringArrayInput<${typeToChange}> | ${typeToChange}[]`
      );
    });
  });

  describe('when handling nullable types', () => {
    it('should correctly handle nullable JsonValue types', () => {
      expect(findNewSignature('JsonValue | null', typeToChange, model, field)).toBe(
        `${typeToChange} | null`
      );
      expect(findNewSignature('runtime.JsonValue | null', typeToChange, model, field)).toBe(
        `${typeToChange} | null`
      );
      expect(findNewSignature('InputJsonValue | null', typeToChange, model, field)).toBe(
        `${typeToChange} | null`
      );
      expect(
        findNewSignature('InputJsonValue | InputJsonValue | null', typeToChange, model, field)
      ).toBe(`${typeToChange} | null`);
    });

    it('should handle nullable filter types', () => {
      expect(
        findNewSignature('IntNullableFilter<"User"> | number | null', typeToChange, model, field)
      ).toBe(`${typeToChange} | null`);
      expect(
        findNewSignature(
          'IntNullableWithAggregatesFilter<"User"> | number | null',
          typeToChange,
          model,
          field
        )
      ).toBe(`${typeToChange} | null`);
      expect(
        findNewSignature('FloatNullableFilter<"User"> | number | null', typeToChange, model, field)
      ).toBe(`${typeToChange} | null`);
      expect(
        findNewSignature(
          'FloatNullableWithAggregatesFilter<"User"> | number | null',
          typeToChange,
          model,
          field
        )
      ).toBe(`${typeToChange} | null`);
    });

    it('should handle nullable JsonNullValueInput types', () => {
      const result = findNewSignature(
        'NullableJsonNullValueInput | InputJsonValue',
        typeToChange,
        model,
        field
      );
      expect(result).toBe(`${typeToChange} | NullableJsonNullValueInput`);
    });

    it('should not transform complex nullable filter types', () => {
      expect(
        findNewSignature('JsonNullableWithAggregatesFilter<"User">', typeToChange, model, field)
      ).toBeUndefined();
      expect(
        findNewSignature('JsonNullableFilter<"User">', typeToChange, model, field)
      ).toBeUndefined();
    });
  });

  describe('when handling array types', () => {
    it('should handle JsonValue arrays', () => {
      expect(findNewSignature('JsonValue[]', typeToChange, model, field)).toBe(`${typeToChange}[]`);
      expect(findNewSignature('InputJsonValue[]', typeToChange, model, field)).toBe(
        `${typeToChange}[]`
      );
      expect(
        findNewSignature('UserCreatelistInput | InputJsonValue[]', typeToChange, model, field)
      ).toBe(`${typeToChange}[]`);
    });

    it('should transform JsonNullableListFilter', () => {
      const result = findNewSignature('JsonNullableListFilter<"User">', typeToChange, model, field);
      expect(result).toBe(`NullableListFilter<${typeToChange}>`);
    });

    it('should transform update and create array inputs', () => {
      expect(
        findNewSignature('UserUpdatedataInput | InputJsonValue[]', typeToChange, model, field)
      ).toBe(`UpdateManyInput<${typeToChange}>`);
      expect(
        findNewSignature('UserCreatedataInput | InputJsonValue[]', typeToChange, model, field)
      ).toBe(`CreateManyInput<${typeToChange}>`);
    });
  });

  describe('when handling update types', () => {
    it('should add UpdateInput wrapper for update operations', () => {
      const result = findNewSignature('string', typeToChange, 'UserUpdateInput', field);
      expect(result).toBe(`UpdateInput<${typeToChange}>`);
    });

    it('should handle other update variants', () => {
      const result = findNewSignature(
        'string',
        typeToChange,
        'UserUpdateWithoutProfileInput',
        field
      );
      expect(result).toBe(`UpdateInput<${typeToChange}>`);

      const result2 = findNewSignature(
        'string',
        typeToChange,
        'UserUpdateManyWithoutPostsInput',
        field
      );
      expect(result2).toBe(`UpdateInput<${typeToChange}>`);
    });
  });

  describe('when handling Prisma namespace', () => {
    it('should remove Prisma namespace from signature', () => {
      expect(findNewSignature('Prisma.JsonValue', typeToChange, model, field)).toBe(typeToChange);
      expect(findNewSignature('Prisma.InputJsonValue', typeToChange, model, field)).toBe(
        typeToChange
      );
    });
  });

  describe('when handling runtime namespace', () => {
    it('should remove runtime namespace from signature', () => {
      expect(findNewSignature('runtime.JsonValue', typeToChange, model, field)).toBe(typeToChange);
      expect(findNewSignature('runtime.InputJsonValue | null', typeToChange, model, field)).toBe(
        `${typeToChange} | null`
      );
    });
  });

  describe('when handling Prisma skip variants', () => {
    it('should handle | runtime.Types.Skip', () => {
      const result = findNewSignature('string | runtime.Types.Skip', typeToChange, model, field);
      expect(result).toBe(`${typeToChange}| runtime.Types.Skip`);
    });

    it('should handle | $Types.Skip', () => {
      const result = findNewSignature('string | $Types.Skip', typeToChange, model, field);
      expect(result).toBe(`${typeToChange}| $Types.Skip`);
    });
  });

  describe('when throwOnNotFound is true with unsupported types', () => {
    it('should throw an error for unrecognized signatures by default', () => {
      expect(() => {
        findNewSignature('SomeUnsupportedType', typeToChange, model, field, true);
      }).toThrow('Found unsupported required field type');
    });

    it('should not throw an error when throwOnNotFound is false', () => {
      expect(
        findNewSignature('SomeUnsupportedType', typeToChange, model, field, false)
      ).toBeUndefined();
    });
  });

  describe('with custom libNamespace', () => {
    it('should use the provided namespace in transformed types', () => {
      const libNamespace = 'MyLib.';
      const result = findNewSignature(
        'StringFilter<"User"> | string',
        typeToChange,
        model,
        field,
        true,
        true,
        libNamespace
      );
      expect(result).toBe(`MyLib.TypedStringFilter<${typeToChange}> | ${typeToChange}`);
    });
  });
});
