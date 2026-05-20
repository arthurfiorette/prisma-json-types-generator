import type { PrismaJsonTypesGeneratorConfig } from './config';
import { createType } from './create-signature';

describe('createType', () => {
  const mockConfig: PrismaJsonTypesGeneratorConfig = {
    namespace: 'PrismaJson',
    useType: undefined,
    allowAny: false
  };

  describe('when description is undefined', () => {
    it('returns "unknown" for undefined description', () => {
      expect(createType(undefined, mockConfig)).toBe('unknown');
    });
  });

  describe('when description does not contain valid type syntax', () => {
    it('returns "unknown" for invalid syntax', () => {
      expect(createType('invalid description', mockConfig)).toBe('unknown');
    });

    it('returns "unknown" for empty string', () => {
      expect(createType('', mockConfig)).toBe('unknown');
    });

    it('returns "unknown" for description with no parseable type syntax', () => {
      expect(createType('@Comment(Some comment)', mockConfig)).toBe('unknown');
    });

    it('returns "unknown" for description with malformed brackets', () => {
      expect(createType('SomeType', mockConfig)).toBe('unknown');
      expect(createType('[UnclosedBracket', mockConfig)).toBe('unknown');
    });
  });

  describe('when description contains valid type syntax', () => {
    it('parses single line bracket syntax correctly', () => {
      expect(createType('[User]', mockConfig)).toBe('PrismaJson.User');
    });

    it('handles multi-line descriptions and parses the first valid line', () => {
      const description = '@Comment(ignored)\n[User]\n@AnotherTag(ignored)';
      expect(createType(description, mockConfig)).toBe('PrismaJson.User');
    });

    it('handles multi-line description with first line being invalid', () => {
      const description = '@Comment(ignored)\n[User]\n[AnotherType]';
      expect(createType(description, mockConfig)).toBe('PrismaJson.User');
    });

    it('returns unknown when only invalid syntax in multiline', () => {
      const description = '@Comment(ignored)\nInvalidLine\n@AnotherTag(ignored)';
      expect(createType(description, mockConfig)).toBe('unknown');
    });
  });

  describe('when parsed result has literal type', () => {
    it('returns literal type wrapped in parentheses', () => {
      expect(createType('![string]', mockConfig)).toBe('(string)');
      expect(createType('![number]', mockConfig)).toBe('(number)');
      expect(createType('![some complex type]', mockConfig)).toBe('(some complex type)');
    });
  });

  describe('when config.useType is defined', () => {
    it('uses type mapping with global type map', () => {
      const customConfig: PrismaJsonTypesGeneratorConfig = {
        ...mockConfig,
        useType: 'TypeMap'
      };
      expect(createType('[User]', customConfig)).toBe('PrismaJson.TypeMap["User"]');
    });

    it('uses type mapping with literal types', () => {
      const customConfig: PrismaJsonTypesGeneratorConfig = {
        ...mockConfig,
        useType: 'TypeMap'
      };
      expect(createType('![string]', customConfig)).toBe('(string)');
    });
  });

  describe('regular type resolution', () => {
    it('formats type with namespace when no literal and no useType', () => {
      expect(createType('[User]', mockConfig)).toBe('PrismaJson.User');
      expect(createType('[CustomType]', mockConfig)).toBe('PrismaJson.CustomType');
    });

    it('handles nested types correctly', () => {
      expect(createType('[User.NestedType]', mockConfig)).toBe('PrismaJson.User.NestedType');
    });

    it('handles types with special characters', () => {
      expect(createType('[User_Type]', mockConfig)).toBe('PrismaJson.User_Type');
      expect(createType('[User-Type]', mockConfig)).toBe('PrismaJson.User-Type');
    });
  });

  describe('complex parsing scenarios', () => {
    it('handles multi-line description as described in function comment', () => {
      const description =
        '@DtoCastType(Customization, ../../types, Customization)\n[CustomizationType]';
      expect(createType(description, mockConfig)).toBe('PrismaJson.CustomizationType');
    });

    it('handles nested brackets', () => {
      expect(createType('[Array[NestedType]]', mockConfig)).toBe('PrismaJson.Array[NestedType]');
    });

    it('handles escaped brackets', () => {
      // Note: This tests the behavior when brackets are escaped, which affects parsing
      // Escaped brackets (\\[ and \\]) should remain as literal characters
      expect(createType('[Type\\[Nested\\]]', mockConfig)).toBe('PrismaJson.Type\\[Nested\\]');
    });
  });

  describe('edge cases', () => {
    it('handles empty type inside brackets', () => {
      expect(createType('[]', mockConfig)).toBe('unknown');
    });

    it('handles whitespace-only type inside brackets', () => {
      // Whitespace-only content inside brackets is treated as the type
      expect(createType('[   ]', mockConfig)).toBe('PrismaJson.   ');
    });

    it('handles extra spaces around the type', () => {
      // Spaces around the inner type get preserved in the output
      expect(createType('[ UserType ]', mockConfig)).toBe('PrismaJson. UserType ');
    });
  });
});
