import type { GeneratorConfig } from '@prisma/generator';
import { PrismaJsonTypesGeneratorError } from './error';
import { findPrismaClientGenerator } from './prisma-generator';

describe('findPrismaClientGenerator', () => {
  const mockGenerators: GeneratorConfig[] = [
    {
      name: 'first-generator',
      provider: { fromEnvVar: null, value: 'some-other-generator' },
      output: { fromEnvVar: null, value: '/some/output/path' },
      config: {},
      binaryTargets: [],
      previewFeatures: [],
      sourceFilePath: '/some/path'
    },
    {
      name: 'prisma-client-js',
      provider: { fromEnvVar: null, value: 'prisma-client-js' },
      output: { fromEnvVar: null, value: '/client/output/path' },
      config: {},
      binaryTargets: [],
      previewFeatures: [],
      sourceFilePath: '/some/path'
    }
  ];

  const mockGeneratorsWithPrismaClient: GeneratorConfig[] = [
    {
      name: 'first-generator',
      provider: { fromEnvVar: null, value: 'some-other-generator' },
      output: { fromEnvVar: null, value: '/some/output/path' },
      config: {},
      binaryTargets: [],
      previewFeatures: [],
      sourceFilePath: '/some/path'
    },
    {
      name: 'prisma-client',
      provider: { fromEnvVar: null, value: 'prisma-client' },
      output: { fromEnvVar: null, value: '/client/output/path' },
      config: {},
      binaryTargets: [],
      previewFeatures: [],
      sourceFilePath: '/some/path'
    }
  ];

  describe('when prisma client generator is found with prisma-client-js', () => {
    it('should return the prisma client generator config', () => {
      const result = findPrismaClientGenerator(mockGenerators);

      expect(result.name).toBe('prisma-client-js');
      expect(result.provider.value).toBe('prisma-client-js');
      expect(result.output.value).toBe('/client/output/path');
    });
  });

  describe('when prisma client generator is found with prisma-client', () => {
    it('should return the prisma client generator config', () => {
      const result = findPrismaClientGenerator(mockGeneratorsWithPrismaClient);

      expect(result.name).toBe('prisma-client');
      expect(result.provider.value).toBe('prisma-client');
      expect(result.output.value).toBe('/client/output/path');
    });
  });

  describe('when prisma client generator is not found', () => {
    it('should throw PrismaJsonTypesGeneratorError', () => {
      const emptyGenerators: GeneratorConfig[] = [];
      const generatorsWithoutPrisma: GeneratorConfig[] = [
        {
          name: 'first-generator',
          provider: { fromEnvVar: null, value: 'some-other-generator' },
          output: { fromEnvVar: null, value: '/some/output/path' },
          config: {},
          binaryTargets: [],
          previewFeatures: [],
          sourceFilePath: '/some/path'
        }
      ];

      expect(() => findPrismaClientGenerator(emptyGenerators)).toThrow(
        PrismaJsonTypesGeneratorError
      );

      expect(() => findPrismaClientGenerator(generatorsWithoutPrisma)).toThrow(
        PrismaJsonTypesGeneratorError
      );

      expect(() => findPrismaClientGenerator(emptyGenerators)).toThrow(
        'Could not find client generator options, are you using `prisma-client-js` or `prisma-client` before `prisma-json-types-generator`?'
      );

      expect(() => findPrismaClientGenerator(generatorsWithoutPrisma)).toThrow(
        'Could not find client generator options, are you using `prisma-client-js` or `prisma-client` before `prisma-json-types-generator`?'
      );
    });
  });

  describe('when prisma client generator is found but has no output value', () => {
    it('should throw PrismaJsonTypesGeneratorError with the generator config', () => {
      const generatorsWithNoOutput: GeneratorConfig[] = [
        {
          name: 'prisma-client-js',
          provider: { fromEnvVar: null, value: 'prisma-client-js' },
          output: { fromEnvVar: null, value: undefined as any }, // No output value
          config: {},
          binaryTargets: [],
          previewFeatures: [],
          sourceFilePath: '/some/path'
        }
      ];

      expect(() => findPrismaClientGenerator(generatorsWithNoOutput)).toThrow(
        PrismaJsonTypesGeneratorError
      );

      expect(() => findPrismaClientGenerator(generatorsWithNoOutput)).toThrow(
        '`prisma-client-js` or `prisma-client` output not found'
      );
    });

    it('should throw PrismaJsonTypesGeneratorError when output is null', () => {
      const generatorsWithNullOutput: GeneratorConfig[] = [
        {
          name: 'prisma-client',
          provider: { fromEnvVar: null, value: 'prisma-client' },
          output: null, // Null output
          config: {},
          binaryTargets: [],
          previewFeatures: [],
          sourceFilePath: '/some/path'
        }
      ];

      expect(() => findPrismaClientGenerator(generatorsWithNullOutput)).toThrow(
        PrismaJsonTypesGeneratorError
      );

      expect(() => findPrismaClientGenerator(generatorsWithNullOutput)).toThrow(
        '`prisma-client-js` or `prisma-client` output not found'
      );
    });
  });

  describe('return type assertion', () => {
    it('should return GeneratorConfig with guaranteed output value', () => {
      const result = findPrismaClientGenerator(mockGenerators);

      // This test verifies that the function properly asserts the return type
      // The output.value property should be accessible without additional checks
      expect(typeof result.output.value).toBe('string');
      expect(result.output.value).toBe('/client/output/path');
    });
  });
});
