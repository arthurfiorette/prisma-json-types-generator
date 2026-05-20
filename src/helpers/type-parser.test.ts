import { parseTypeSyntax } from './type-parser';

describe('parseTypeSyntax', () => {
  test('should return null for undefined input', () => {
    expect(parseTypeSyntax(undefined)).toBeNull();
  });

  test('should return null for null input', () => {
    expect(parseTypeSyntax(null as any)).toBeNull();
  });

  test('should return null for empty string', () => {
    expect(parseTypeSyntax('')).toBeNull();
  });

  test('should return null for whitespace only string', () => {
    expect(parseTypeSyntax('   ')).toBeNull();
  });

  test('should parse simple type syntax', () => {
    expect(parseTypeSyntax('[TYPE] comment')).toEqual({
      literal: false,
      type: 'TYPE'
    });
  });

  test('should parse literal type syntax', () => {
    expect(parseTypeSyntax('![LITERAL_TYPE] comment')).toEqual({
      literal: true,
      type: 'LITERAL_TYPE'
    });
  });

  test('should handle nested brackets', () => {
    expect(parseTypeSyntax('[TYPE[INNER]] comment')).toEqual({
      literal: false,
      type: 'TYPE[INNER]'
    });
  });

  test('should handle deeply nested brackets', () => {
    expect(parseTypeSyntax('[TYPE[INNER[DEEP]]] comment')).toEqual({
      literal: false,
      type: 'TYPE[INNER[DEEP]]'
    });
  });

  test('should handle literal with nested brackets', () => {
    expect(parseTypeSyntax('![LITERAL[INNER]] comment')).toEqual({
      literal: true,
      type: 'LITERAL[INNER]'
    });
  });

  test('should return null if no opening bracket', () => {
    expect(parseTypeSyntax('TYPE] comment')).toBeNull();
  });

  test('should return null for malformed brackets', () => {
    expect(parseTypeSyntax('[TYPE comment')).toBeNull();
  });

  test('should return null if closing bracket is not found', () => {
    expect(parseTypeSyntax('[TYPE comment')).toBeNull();
  });

  test('should return null for empty type', () => {
    expect(parseTypeSyntax('[] comment')).toBeNull();
  });

  test('should return null for empty literal type', () => {
    expect(parseTypeSyntax('![] comment')).toBeNull();
  });

  test('should handle escaped brackets inside type', () => {
    expect(parseTypeSyntax('[TYPE\\[ESCAPED\\]] comment')).toEqual({
      literal: false,
      type: 'TYPE\\[ESCAPED\\]'
    });
  });

  test('should parse type with spaces', () => {
    expect(parseTypeSyntax('[TYPE WITH SPACES] comment')).toEqual({
      literal: false,
      type: 'TYPE WITH SPACES'
    });
  });

  test('should handle various characters in type', () => {
    expect(parseTypeSyntax('[Type123_Special-Char] comment')).toEqual({
      literal: false,
      type: 'Type123_Special-Char'
    });
  });

  test('should handle leading and trailing whitespace properly', () => {
    expect(parseTypeSyntax('  [TYPE] comment  ')).toEqual({
      literal: false,
      type: 'TYPE'
    });
  });

  test('should return null if prefix exists before opening bracket', () => {
    expect(parseTypeSyntax('prefix [TYPE] comment')).toBeNull();
  });

  test('should return null if prefix exists before opening bracket with literal', () => {
    expect(parseTypeSyntax('prefix ![LITERAL] comment')).toBeNull();
  });

  test('should handle single character type', () => {
    expect(parseTypeSyntax('[T] comment')).toEqual({
      literal: false,
      type: 'T'
    });
  });

  test('should handle single character type with literal', () => {
    expect(parseTypeSyntax('![L] comment')).toEqual({
      literal: true,
      type: 'L'
    });
  });

  test('should capture everything between first [ and matching ] as type', () => {
    expect(parseTypeSyntax('[ARRAY[NUMBER, STRING]] rest')).toEqual({
      literal: false,
      type: 'ARRAY[NUMBER, STRING]'
    });
  });
});
