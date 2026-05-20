import type { GeneratorManifest } from '@prisma/generator';
import { onManifest } from './on-manifest';

// Mock the required modules
jest.mock(
  'prisma/package.json',
  () => ({
    version: '4.0.0'
  }),
  { virtual: true }
);

jest.mock(
  '../package.json',
  () => ({
    version: '1.0.0',
    peerDependencies: {
      prisma: '^4.0.0'
    }
  }),
  { virtual: true }
);

describe('onManifest', () => {
  // Capture console logs for testing
  const originalConsoleLog = console.log;

  beforeEach(() => {
    // Mock console.log to capture logs
    console.log = jest.fn();
  });

  afterEach(() => {
    // Restore original console.log
    console.log = originalConsoleLog;
    jest.clearAllMocks();
  });

  it('should return the correct manifest structure', () => {
    const result = onManifest();

    const expected: GeneratorManifest = {
      version: '1.0.0',
      defaultOutput: './',
      prettyName: 'Prisma Json Types Generator'
    };

    expect(result).toEqual(expected);
  });

  it('should return manifest with version when package.json is available', () => {
    const result = onManifest();

    expect(result.version).toBe('1.0.0');
    expect(result.defaultOutput).toBe('./');
    expect(result.prettyName).toBe('Prisma Json Types Generator');
  });

  it('should log a warning when prisma version does not satisfy peer dependency', () => {
    // Mock different prisma versions to trigger the warning
    jest.resetModules();

    // Temporarily mock different versions that don't satisfy the peer dependency
    jest.doMock(
      'prisma/package.json',
      () => ({
        version: '5.0.0' // This doesn't satisfy ^4.0.0 in most cases
      }),
      { virtual: true }
    );

    jest.doMock(
      '../package.json',
      () => ({
        version: '1.0.0',
        peerDependencies: {
          prisma: '^4.0.0'
        }
      }),
      { virtual: true }
    );

    const { onManifest: onManifestLocal } = require('./on-manifest');
    const result = onManifestLocal();

    // Check that console.log was called (indicating a warning was logged)
    expect(console.log).toHaveBeenCalled();
    expect(result.version).toBe('1.0.0');

    // Restore modules
    jest.dontMock('prisma/package.json');
    jest.dontMock('../package.json');
  });

  it('should handle cases where package.json cannot be loaded', async () => {
    // Mock the require function to simulate failure
    jest.resetModules();
    jest.mock(
      '../package.json',
      () => {
        throw new Error('Cannot load package.json');
      },
      { virtual: true }
    );

    // Need to reload the module after mocking is set up
    const newModule = require('./on-manifest');
    const result = newModule.onManifest();

    // After require fails, version should be undefined
    expect(result.version).toBeUndefined();
    expect(result.defaultOutput).toBe('./');
    expect(result.prettyName).toBe('Prisma Json Types Generator');

    // Clean up
    jest.resetModules();
  });

  it('should handle edge case where prisma package.json is not available', () => {
    // Mock the scenario where prisma package.json throws an error
    // This will be caught in the try/catch block in the original function
    // causing the version to remain undefined
    jest.resetModules();

    // Keep normal package.json (with proper structure)
    jest.doMock(
      '../package.json',
      () => ({
        version: '1.0.0',
        peerDependencies: {
          prisma: '^4.0.0'
        }
      }),
      { virtual: true }
    );

    // Mock prisma package to throw error
    jest.doMock(
      'prisma/package.json',
      () => {
        throw new Error('Module not found');
      },
      { virtual: true }
    );

    // Require the module in the new context
    const { onManifest: onManifestWithFailedPrisma } = require('./on-manifest');
    const result = onManifestWithFailedPrisma();

    // Since any error in the try block sets version to undefined,
    // if prisma package.json throws, version should be undefined
    expect(result.version).toBeUndefined();
    // The error from prisma package.json should be caught, so no log should occur for this specific case
    // (the log only happens if there's a version mismatch, not a require error)
    expect(console.log).not.toHaveBeenCalled();

    // Restore
    jest.dontMock('prisma/package.json');
    jest.dontMock('../package.json');
    jest.resetModules();
  });

  it('should return undefined version when require fails', () => {
    // Mock the require to fail for the package.json
    jest.resetModules();
    jest.doMock(
      '../package.json',
      () => {
        throw new Error('Could not require package.json');
      },
      { virtual: true }
    );

    const { onManifest: onManifestLocal } = require('./on-manifest');
    const result = onManifestLocal();

    expect(result.version).toBeUndefined();
    expect(result.defaultOutput).toBe('./');
    expect(result.prettyName).toBe('Prisma Json Types Generator');

    // Restore
    jest.dontMock('../package.json');
  });
});
