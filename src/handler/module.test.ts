import { Result } from 'try';
import ts from 'typescript';
import type { PrismaEntity } from '../helpers/dmmf';
import type { PrismaJsonTypesGeneratorConfig } from '../util/config';
import { PRISMA_NAMESPACE_NAME } from '../util/constants';
import type { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import { handlePrismaModule } from './module';
import { handleStatement } from './statement';

// Mock the dependencies
jest.mock('./statement', () => ({
  handleStatement: jest.fn()
}));
jest.mock('try', () => ({
  Result: {
    try: jest.fn()
  }
}));

describe('handlePrismaModule', () => {
  let mockWriter: DeclarationWriter;
  let mockModelMap: Map<string, PrismaEntity>;
  let mockKnownNoOps: Set<string>;
  let mockTypeToNameMap: Map<string, string>;
  let mockConfig: PrismaJsonTypesGeneratorConfig;

  beforeEach(() => {
    mockWriter = {
      write: jest.fn(),
      writeln: jest.fn()
    } as unknown as DeclarationWriter;

    mockModelMap = new Map();
    mockKnownNoOps = new Set();
    mockTypeToNameMap = new Map();
    mockConfig = {} as PrismaJsonTypesGeneratorConfig;

    // Reset mocks
    (handleStatement as jest.MockedFunction<typeof handleStatement>).mockClear();
    (Result.try as jest.Mocked<any>).mockClear();
  });

  it('should return undefined when module name is not prisma namespace', () => {
    // Create a mock module declaration with a different name
    const mockIdentifier = {
      kind: ts.SyntaxKind.Identifier,
      text: 'differentNamespace'
    };

    const mockModule = {
      getChildren: jest.fn().mockReturnValue([mockIdentifier])
    } as unknown as ts.ModuleDeclaration;

    const result = handlePrismaModule(
      mockModule,
      mockWriter,
      mockModelMap,
      mockKnownNoOps,
      mockTypeToNameMap,
      mockConfig
    );

    expect(result).toBeUndefined();
    expect(mockModule.getChildren).toHaveBeenCalled();
  });

  it('should throw error when prisma namespace content is empty', () => {
    const mockIdentifier = {
      kind: ts.SyntaxKind.Identifier,
      text: PRISMA_NAMESPACE_NAME
    };

    const mockModuleBlock = {
      kind: ts.SyntaxKind.ModuleBlock,
      statements: []
    };

    const mockModule = {
      getChildren: jest
        .fn()
        .mockReturnValueOnce([mockIdentifier])
        .mockReturnValueOnce([mockModuleBlock])
    } as unknown as ts.ModuleDeclaration;

    expect(() => {
      handlePrismaModule(
        mockModule,
        mockWriter,
        mockModelMap,
        mockKnownNoOps,
        mockTypeToNameMap,
        mockConfig
      );
    }).toThrow(PrismaJsonTypesGeneratorError);
  });

  it('should process all statements when prisma namespace has content', () => {
    const mockIdentifier = {
      kind: ts.SyntaxKind.Identifier,
      text: PRISMA_NAMESPACE_NAME
    };

    const mockStatement1 = {} as ts.Statement;
    const mockStatement2 = {} as ts.Statement;

    const mockModuleBlock = {
      kind: ts.SyntaxKind.ModuleBlock,
      statements: [mockStatement1, mockStatement2]
    };

    const mockModule = {
      getChildren: jest
        .fn()
        .mockReturnValueOnce([mockIdentifier]) // For identifier check
        .mockReturnValueOnce([mockModuleBlock]) // For module block
    } as unknown as ts.ModuleDeclaration;

    // Mock handleStatement to return normally when called
    (handleStatement as jest.MockedFunction<typeof handleStatement>).mockImplementation(
      () => undefined
    );

    // Mock Result.try to execute the provided function and return success
    (Result.try as jest.Mocked<any>).mockImplementation((fn: () => void) => {
      try {
        fn(); // Execute the function that contains handleStatement calls
        return { ok: true, error: null };
      } catch (error) {
        return { ok: false, error };
      }
    });

    handlePrismaModule(
      mockModule,
      mockWriter,
      mockModelMap,
      mockKnownNoOps,
      mockTypeToNameMap,
      mockConfig
    );

    expect(handleStatement).toHaveBeenCalledTimes(2);
    expect(handleStatement).toHaveBeenCalledWith(
      mockStatement1,
      mockWriter,
      mockModelMap,
      mockTypeToNameMap,
      mockKnownNoOps,
      mockConfig
    );
    expect(handleStatement).toHaveBeenCalledWith(
      mockStatement2,
      mockWriter,
      mockModelMap,
      mockTypeToNameMap,
      mockKnownNoOps,
      mockConfig
    );
  });

  it('should handle successful processing of statements', () => {
    const mockIdentifier = {
      kind: ts.SyntaxKind.Identifier,
      text: PRISMA_NAMESPACE_NAME
    };

    const mockStatement = {} as ts.Statement;

    const mockModuleBlock = {
      kind: ts.SyntaxKind.ModuleBlock,
      statements: [mockStatement]
    };

    const mockModule = {
      getChildren: jest
        .fn()
        .mockReturnValueOnce([mockIdentifier])
        .mockReturnValueOnce([mockModuleBlock])
    } as unknown as ts.ModuleDeclaration;

    // Mock handleStatement to return normally when called
    (handleStatement as jest.MockedFunction<typeof handleStatement>).mockImplementation(
      () => undefined
    );

    // Mock Result.try to execute the provided function and return success
    (Result.try as jest.Mocked<any>).mockImplementation((fn: () => void) => {
      try {
        fn(); // Execute the function that contains handleStatement calls
        return { ok: true, error: null };
      } catch (error) {
        return { ok: false, error };
      }
    });

    expect(() => {
      handlePrismaModule(
        mockModule,
        mockWriter,
        mockModelMap,
        mockKnownNoOps,
        mockTypeToNameMap,
        mockConfig
      );
    }).not.toThrow();

    expect(Result.try).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should rethrow non-custom errors', () => {
    const mockIdentifier = {
      kind: ts.SyntaxKind.Identifier,
      text: PRISMA_NAMESPACE_NAME
    };

    const mockStatement = {} as ts.Statement;

    const mockModuleBlock = {
      kind: ts.SyntaxKind.ModuleBlock,
      statements: [mockStatement]
    };

    const mockModule = {
      getChildren: jest
        .fn()
        .mockReturnValueOnce([mockIdentifier])
        .mockReturnValueOnce([mockModuleBlock])
    } as unknown as ts.ModuleDeclaration;

    const mockStandardError = new Error('Standard error');

    // Mock handleStatement to throw the standard error when called
    (handleStatement as jest.MockedFunction<typeof handleStatement>).mockImplementation(() => {
      throw mockStandardError;
    });

    // Mock Result.try to execute the provided function and return the caught error
    (Result.try as jest.Mocked<any>).mockImplementation((fn: () => void) => {
      try {
        fn(); // Execute the function that contains handleStatement calls
        return { ok: true, error: null };
      } catch (error) {
        return { ok: false, error };
      }
    });

    expect(() => {
      // Mock console.error to prevent logging during the test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      handlePrismaModule(
        mockModule,
        mockWriter,
        mockModelMap,
        mockKnownNoOps,
        mockTypeToNameMap,
        mockConfig
      );
      consoleSpy.mockRestore();
    }).toThrow(Error);
  });

  it('should handle edge case where module has no identifier', () => {
    const mockEmptyArray: ts.Node[] = [];
    const mockModule = {
      getChildren: jest.fn().mockReturnValue(mockEmptyArray)
    } as unknown as ts.ModuleDeclaration;

    const result = handlePrismaModule(
      mockModule,
      mockWriter,
      mockModelMap,
      mockKnownNoOps,
      mockTypeToNameMap,
      mockConfig
    );

    expect(result).toBeUndefined();
  });
});
