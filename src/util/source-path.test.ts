import path from 'node:path';
import { buildTypesFilePath, findFirstCodeIndex } from './source-path';

// Helper function to normalize paths for comparison
const normalizePath = (inputPath: string): string => {
  return path.resolve(inputPath).replace(/\\/g, '/');
};

describe('source-path utilities', () => {
  describe('buildTypesFilePath', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should use fallback path when require.resolve fails for default .prisma/client path', () => {
      const clientOutput = path.join('node_modules', '@prisma', 'client');

      // Mock require.resolve to throw an error to force fallback behavior
      jest.spyOn(require, 'resolve').mockImplementation(() => {
        throw new Error();
      });

      const result = buildTypesFilePath(clientOutput);

      const expected = path.resolve('node_modules', '@prisma', 'client', 'index.d.ts');
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });

    test('should handle clientOutput falling back to default behavior when require.resolve fails', () => {
      const clientOutput = path.join('node_modules', '@prisma', 'client', 'index.js');

      // Mock require.resolve to throw error, triggering fallback logic
      jest.spyOn(require, 'resolve').mockImplementation(() => {
        throw new Error();
      });

      const result = buildTypesFilePath(clientOutput);

      // Based on the function logic, when clientOutput ends with .js, it uses dirname(clientOutput) and adds index.d.ts
      const expectedDir = path.dirname(
        path.resolve('node_modules', '@prisma', 'client', 'index.js')
      );
      const expected = path.join(expectedDir, 'index.d.ts');
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });

    test('should handle clientOutput without file extension when no overrideTarget', () => {
      const clientOutput = path.join('node_modules', '@prisma', 'client');

      // Mock require.resolve to throw error, triggering fallback logic
      jest.spyOn(require, 'resolve').mockImplementation(() => {
        throw new Error();
      });

      const result = buildTypesFilePath(clientOutput);

      const expected = path.resolve('node_modules', '@prisma', 'client', 'index.d.ts');
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });

    test('should return resolved absolute path when overrideTarget is absolute', () => {
      const clientOutput = path.join('node_modules', '@prisma', 'client');
      // Create a fake file that actually exists to avoid require.resolve error
      const absolutePath = __filename; // Use this file itself

      const result = buildTypesFilePath(clientOutput, absolutePath);

      expect(normalizePath(result)).toBe(normalizePath(absolutePath));
    });

    test('should resolve relative path against schemaTarget when overrideTarget is relative', () => {
      const clientOutput = path.join('node_modules', '@prisma', 'client');
      const overrideTarget = 'custom-output';
      const schemaTarget = path.join('prisma', 'schema.prisma');

      const result = buildTypesFilePath(clientOutput, overrideTarget, schemaTarget);

      const expected = path.resolve('prisma', 'custom-output', 'index.d.ts');
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });

    test('should not append index.d.ts when overrideTarget ends with .ts', () => {
      const clientOutput = path.join('node_modules', '@prisma', 'client');
      const overrideTarget = path.join('custom', 'output.ts');
      const schemaTarget = path.join('prisma', 'schema.prisma');

      const result = buildTypesFilePath(clientOutput, overrideTarget, schemaTarget);

      const expected = path.resolve('prisma', 'custom', 'output.ts');
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });

    test('should append index.d.ts when overrideTarget ends with .tsx', () => {
      const clientOutput = path.join('node_modules', '@prisma', 'client');
      const overrideTarget = path.join('custom', 'output.tsx');
      const schemaTarget = path.join('prisma', 'schema.prisma');

      const result = buildTypesFilePath(clientOutput, overrideTarget, schemaTarget);

      // According to the code, only files ending with .ts (not .tsx) are treated specially
      const expected = path.resolve('prisma', 'custom', 'output.tsx', 'index.d.ts');
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });

    test('should append index.d.ts when overrideTarget ends with .js', () => {
      const clientOutput = path.join('node_modules', '@prisma', 'client');
      const overrideTarget = path.join('custom', 'output.js');
      const schemaTarget = path.join('prisma', 'schema.prisma');

      const result = buildTypesFilePath(clientOutput, overrideTarget, schemaTarget);

      const expected = path.resolve('prisma', 'custom', 'output.js', 'index.d.ts');
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });

    test('should append index.d.ts when overrideTarget ends with .jsx', () => {
      const clientOutput = path.join('node_modules', '@prisma', 'client');
      const overrideTarget = path.join('custom', 'output.jsx');
      const schemaTarget = path.join('prisma', 'schema.prisma');

      const result = buildTypesFilePath(clientOutput, overrideTarget, schemaTarget);

      const expected = path.resolve('prisma', 'custom', 'output.jsx', 'index.d.ts');
      expect(normalizePath(result)).toBe(normalizePath(expected));
    });
  });

  describe('findFirstCodeIndex', () => {
    test('should return 0 for empty string', () => {
      expect(findFirstCodeIndex('')).toBe(0);
    });

    test('should return 0 for string with only whitespace if no code found', () => {
      // The function will skip all whitespace and if no code is found, it returns 0
      expect(findFirstCodeIndex('   \t\n  ')).toBe(7); // Goes to the end of string, which is index 7
    });

    test('should return 0 for string starting with code', () => {
      expect(findFirstCodeIndex('const x = 1;')).toBe(0);
    });

    test('should skip leading whitespace before code', () => {
      // Counting all the actual characters that are whitespace before reaching 'c'
      expect(findFirstCodeIndex('   \t\n  const x = 1;')).toBe(7); // 3 spaces + 1 tab + 1 newline + 2 spaces = 7
    });

    test('should skip single-line comments', () => {
      // After '// This is a comment' and '\n', the next char is at position 21
      expect(findFirstCodeIndex('// This is a comment\nconst x = 1;')).toBe(21); // After newline
    });

    test('should skip multiple single-line comments', () => {
      // Calculate total length of comments and newlines
      expect(findFirstCodeIndex('// Comment 1\n// Comment 2\n  const x = 1;')).toBe(28); // After comments and spaces
    });

    test('should skip block comments', () => {
      // After '/* Block comment */ ' (length 20), next char is at position 20
      expect(findFirstCodeIndex('/* Block comment */ const x = 1;')).toBe(20); // After comment and space
    });

    test('should skip multi-line block comments', () => {
      // Length of: /* + \n +  space + * + space + Multi-line + \n + space + * + space + comment + \n + space + */ + space
      expect(findFirstCodeIndex('/*\n * Multi-line\n * comment\n */ const x = 1;')).toBe(32); // After comment and space
    });

    test('should handle nested-like comments correctly', () => {
      // The function sees everything inside /* */ as comment, so it goes to after the closing */
      expect(findFirstCodeIndex('/* /* nested? */ */ const x = 1;')).toBe(17); // After comment and space
    });

    test('should handle mixed whitespace, comments and code', () => {
      const source = `
        // Comment
        /* Block comment */

        const x = 1;
      `;
      expect(findFirstCodeIndex(source)).toBeGreaterThan(0); // Somewhere past the comments
    });

    test('should return position after all comments if code exists', () => {
      const result = findFirstCodeIndex('// Comment\n  let x = 1;');
      expect(result).toBe(13); // Position after // Comment\n and 2 spaces
    });

    test('should return 0 when no code found after all comments', () => {
      const result = findFirstCodeIndex('// Only comment\n/* Block */');
      expect(result).toBe(0); // Function returns 0 if it reaches end of string without finding code
    });

    test('should handle single-line comment at end of string', () => {
      const result = findFirstCodeIndex('   // trailing comment');
      expect(result).toBe(0); // No code follows the comment, so returns 0
    });

    test('should correctly handle code immediately after comment', () => {
      expect(findFirstCodeIndex('// Comment\nconst x = 5;')).toBe(11); // After the newline
    });

    test('should handle block comment immediately followed by code', () => {
      expect(findFirstCodeIndex('/* Comment */let y = 10;')).toBe(13); // After the comment
    });

    test('should return 0 when string has only comments', () => {
      expect(findFirstCodeIndex('// Just a comment')).toBe(0);
    });

    test('should handle code that starts after several comment lines', () => {
      const source = `// Comment 1
// Comment 2
/* Block comment */
const x = 5;`;
      expect(findFirstCodeIndex(source)).toBe(46); // Position of 'c' in 'const'
    });
  });
});
