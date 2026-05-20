// Test the generator.ts entry point
// We need to set up module mocks before importing the generator module

describe('generator.ts entry point', () => {
  let mockGeneratorHandler: jest.Mock;

  beforeEach(() => {
    // Clear any previous mocks
    jest.clearAllMocks();

    // Set up mocks for dependencies
    mockGeneratorHandler = jest.fn();

    jest.mock('@prisma/generator-helper', () => ({
      generatorHandler: mockGeneratorHandler
    }));

    // Also mock the functions that get passed to generatorHandler
    jest.mock('./on-manifest', () => ({
      onManifest: jest.fn(() => ({
        version: 'test-version',
        defaultOutput: './',
        prettyName: 'Prisma Json Types Generator'
      }))
    }));

    jest.mock('./on-generate', () => ({
      onGenerate: jest.fn()
    }));

    // Reset modules to ensure clean import with fresh mocks
    jest.resetModules();
  });

  afterEach(() => {
    jest.unmock('@prisma/generator-helper');
    jest.unmock('./on-manifest');
    jest.unmock('./on-generate');
  });

  it('should call generatorHandler with onManifest and onGenerate functions', async () => {
    // Import the generator module after setting up mocks
    await import('./generator');

    // Verify that generatorHandler was called exactly once
    expect(mockGeneratorHandler).toHaveBeenCalledTimes(1);

    // Get the arguments passed to generatorHandler
    const callArgs = mockGeneratorHandler.mock.calls[0][0];

    // Verify that the object contains both required methods
    expect(callArgs).toBeDefined();
    expect(callArgs).toMatchObject({
      onManifest: expect.any(Function),
      onGenerate: expect.any(Function)
    });
  });

  it('should ensure generatorHandler is called with expected interface', async () => {
    // Import the generator module
    await import('./generator');

    // Verify generatorHandler was called with the exact expected arguments
    expect(mockGeneratorHandler).toHaveBeenCalledWith({
      onManifest: expect.any(Function),
      onGenerate: expect.any(Function)
    });
  });

  it('should only call generatorHandler once during module import', async () => {
    // Import the generator module first time
    await import('./generator');

    // Verify it was called once
    expect(mockGeneratorHandler).toHaveBeenCalledTimes(1);

    // Import again - should not trigger another call due to module caching
    await import('./generator');

    // Still only called once due to module caching
    expect(mockGeneratorHandler).toHaveBeenCalledTimes(1);
  });

  it('should not throw when importing generator module', async () => {
    await expect(import('./generator')).resolves.toBeDefined();
  });
});
