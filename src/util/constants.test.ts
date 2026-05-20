import path from 'node:path';
import { NAMESPACE_PATH, PRISMA_NAMESPACE_NAME, PRISMA_SKIP } from './constants';

describe('Constants', () => {
  describe('PRISMA_NAMESPACE_NAME', () => {
    it('should be equal to "Prisma"', () => {
      expect(PRISMA_NAMESPACE_NAME).toBe('Prisma');
    });
  });

  describe('NAMESPACE_PATH', () => {
    it('should be a valid path to the namespace.d.ts file', () => {
      // Check that it's a string and includes the expected filename
      expect(typeof NAMESPACE_PATH).toBe('string');
      expect(NAMESPACE_PATH).toContain('namespace.d.ts');
      expect(NAMESPACE_PATH).toContain('assets');
    });

    it('should resolve to the correct path relative to __dirname', () => {
      // Calculate what the expected path should be based on current __dirname
      const expectedPath = path.resolve(__dirname, '../../assets/namespace.d.ts');
      expect(NAMESPACE_PATH).toBe(expectedPath);
    });
  });

  describe('PRISMA_SKIP', () => {
    it('should be an array with two elements', () => {
      expect(Array.isArray(PRISMA_SKIP)).toBe(true);
      expect(PRISMA_SKIP.length).toBe(2);
    });

    it('should contain the correct skip values', () => {
      expect(PRISMA_SKIP).toContain('| runtime.Types.Skip');
      expect(PRISMA_SKIP).toContain('| $Types.Skip');
    });

    it('should have the first element as "| runtime.Types.Skip"', () => {
      expect(PRISMA_SKIP[0]).toBe('| runtime.Types.Skip');
    });

    it('should have the second element as "| $Types.Skip"', () => {
      expect(PRISMA_SKIP[1]).toBe('| $Types.Skip');
    });
  });
});
