import type DMMF from '@prisma/dmmf';
import { extractPrismaModels } from './dmmf';

// Mock the dependencies
jest.mock('./regex', () => ({
  createRegexForType: jest.fn((name: string) => [new RegExp(name)]),
  generateTypeNamesFromName: jest.fn((name: string) => [
    name,
    `${name}CreateInput`,
    `${name}UpdateInput`
  ])
}));

jest.mock('./type-parser', () => ({
  parseTypeSyntax: jest.fn()
}));

import { createRegexForType, generateTypeNamesFromName } from './regex';
import { parseTypeSyntax } from './type-parser';

// Helper function to create a minimal DMMF model
const createMockModel = (
  name: string,
  fields: DMMF.Field[],
  dbName: string | null = null
): DMMF.Model => {
  return {
    name,
    fields,
    dbName,
    schema: null,
    uniqueFields: [],
    uniqueIndexes: [],
    primaryKey: null,
    isGenerated: false
  };
};

// Helper function to create a minimal DMMF field
const createMockField = (
  name: string,
  type: string,
  options: Partial<DMMF.Field> = {}
): DMMF.Field => {
  return {
    name,
    type,
    isRequired: false,
    isList: false,
    isUnique: false,
    isId: false,
    isReadOnly: false,
    hasDefaultValue: false,
    kind: 'scalar',
    isGenerated: false,
    isUpdatedAt: false,
    documentation: undefined,
    ...options
  };
};

// Helper function to create a minimal DMMF schema
const createMockSchema = (): DMMF.Schema => {
  return {
    inputObjectTypes: {
      model: [],
      prisma: []
    },
    outputObjectTypes: {
      model: [],
      prisma: []
    },
    enumTypes: {
      model: [],
      prisma: []
    },
    fieldRefTypes: {
      prisma: []
    }
  };
};

// Helper function to create a minimal DMMF mappings
const createMockMappings = (): DMMF.Mappings => {
  return {
    modelOperations: [],
    otherOperations: {
      read: [],
      write: []
    }
  };
};

// Helper function to create a complete DMMF document
const createMockDocument = (datamodel: DMMF.Datamodel): DMMF.Document => {
  return {
    datamodel,
    schema: createMockSchema(),
    mappings: createMockMappings()
  };
};

describe('dmmf helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractPrismaModels', () => {
    it('should extract models with transformable fields', () => {
      const mockDmmf: DMMF.Document = createMockDocument({
        models: [
          createMockModel('User', [
            createMockField('id', 'String', { isRequired: true }),
            createMockField('data', 'Json')
          ])
        ],
        types: [],
        enums: [],
        indexes: []
      });

      const result = extractPrismaModels(mockDmmf);

      expect(result.modelMap.size).toBe(1);
      expect(result.modelMap.has('User')).toBe(true);
      expect(result.knownNoOps.size).toBe(0);
      expect(result.typeToNameMap.size).toBeGreaterThan(0);
    });

    it('should extract types with transformable fields', () => {
      const mockDmmf: DMMF.Document = createMockDocument({
        models: [],
        types: [createMockModel('UserData', [createMockField('preferences', 'Json')])],
        enums: [],
        indexes: []
      });

      const result = extractPrismaModels(mockDmmf);

      expect(result.modelMap.size).toBe(1);
      expect(result.modelMap.has('UserData')).toBe(true);
      expect(result.knownNoOps.size).toBe(0);
      expect(result.typeToNameMap.size).toBeGreaterThan(0);
    });

    it('should handle models with type syntax documentation', () => {
      (parseTypeSyntax as jest.MockedFunction<typeof parseTypeSyntax>).mockReturnValue({
        literal: true,
        type: 'object'
      });

      const mockDmmf: DMMF.Document = createMockDocument({
        models: [
          createMockModel('Post', [
            createMockField('metadata', 'String', { documentation: '[JSON]' })
          ])
        ],
        types: [],
        enums: [],
        indexes: []
      });

      const result = extractPrismaModels(mockDmmf);

      expect(result.modelMap.size).toBe(1);
      expect(result.modelMap.has('Post')).toBe(true);
      expect(result.knownNoOps.size).toBe(0);
    });

    it('should add non-transformable models to knownNoOps', () => {
      const mockDmmf: DMMF.Document = createMockDocument({
        models: [
          createMockModel('Comment', [createMockField('content', 'String', { isRequired: true })])
        ],
        types: [],
        enums: [],
        indexes: []
      });

      (parseTypeSyntax as jest.MockedFunction<typeof parseTypeSyntax>).mockReturnValue(null);

      const result = extractPrismaModels(mockDmmf);

      expect(result.modelMap.size).toBe(0);
      expect(result.knownNoOps.size).toBe(1);
      expect(result.knownNoOps.has('Comment')).toBe(true);
    });

    it('should create regexes for models and types', () => {
      const mockCreateRegexForType = createRegexForType as jest.MockedFunction<
        typeof createRegexForType
      >;
      mockCreateRegexForType.mockImplementation((name: string) => [new RegExp(name)]);

      const mockDmmf: DMMF.Document = createMockDocument({
        models: [createMockModel('TestModel', [createMockField('data', 'Json')])],
        types: [createMockModel('TestType', [createMockField('info', 'Json')])],
        enums: [],
        indexes: []
      });

      const result = extractPrismaModels(mockDmmf);

      expect(mockCreateRegexForType).toHaveBeenCalledWith('TestModel');
      expect(mockCreateRegexForType).toHaveBeenCalledWith('TestType');
      expect(result.modelMap.get('TestModel')?.regexps).toEqual([/TestModel/]);
      expect(result.modelMap.get('TestType')?.regexps).toEqual([/TestType/]);
    });

    it('should create type to name map with generated operations', () => {
      const mockGenerateTypeNamesFromName = generateTypeNamesFromName as jest.MockedFunction<
        typeof generateTypeNamesFromName
      >;
      mockGenerateTypeNamesFromName.mockReturnValue(['User', 'UserCreateInput', 'UserUpdateInput']);

      const mockDmmf: DMMF.Document = createMockDocument({
        models: [createMockModel('User', [createMockField('data', 'Json')])],
        types: [],
        enums: [],
        indexes: []
      });

      const result = extractPrismaModels(mockDmmf);

      expect(mockGenerateTypeNamesFromName).toHaveBeenCalledWith('User');
      expect(result.typeToNameMap.get('User')).toBe('User');
      expect(result.typeToNameMap.get('UserCreateInput')).toBe('User');
      expect(result.typeToNameMap.get('UserUpdateInput')).toBe('User');
    });

    it('should handle empty dmmf', () => {
      const mockDmmf: DMMF.Document = createMockDocument({
        models: [],
        types: [],
        enums: [],
        indexes: []
      });

      const result = extractPrismaModels(mockDmmf);

      expect(result.modelMap.size).toBe(0);
      expect(result.knownNoOps.size).toBe(0);
      expect(result.typeToNameMap.size).toBe(0);
    });

    it('should process both models and types, with types potentially overriding models in the map', () => {
      (parseTypeSyntax as jest.MockedFunction<typeof parseTypeSyntax>).mockReturnValue({
        literal: true,
        type: 'object'
      });

      const mockDmmf: DMMF.Document = createMockDocument({
        models: [createMockModel('Entity', [createMockField('data', 'Json')])],
        types: [createMockModel('Entity', [createMockField('info', 'Json')])],
        enums: [],
        indexes: []
      });

      const result = extractPrismaModels(mockDmmf);

      // The actual behavior depends on the internal processing order;
      // models and types are processed separately, then combined
      expect(result.modelMap.has('Entity')).toBe(true);
      // Since types come after models in the processing loop, if they have the same name,
      // the type may override the model in the final map
    });
  });
});
