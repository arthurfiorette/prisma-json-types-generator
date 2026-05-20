import ts from 'typescript';
import type { PrismaEntity } from '../helpers/dmmf';
import type { PrismaJsonTypesGeneratorConfig } from '../util/config';
import type { DeclarationWriter } from '../util/declaration-writer';
import { PrismaJsonTypesGeneratorError } from '../util/error';
import { handleModelPayload } from './model-payload';
import { replaceObject } from './replace-object';

// Mock the replaceObject function since we're testing handleModelPayload
jest.mock('./replace-object');
const mockReplaceObject = replaceObject as jest.MockedFunction<typeof replaceObject>;

// Helper function to create mock AST nodes with proper getText methods
function createMockTypeAliasDeclaration(name: string, type: any): ts.TypeAliasDeclaration {
  return {
    kind: ts.SyntaxKind.TypeAliasDeclaration,
    name: createMockIdentifier(name),
    type: type
  } as any;
}

function createMockIdentifier(text: string): ts.Identifier {
  return {
    kind: ts.SyntaxKind.Identifier,
    text: text,
    getText: () => text
  } as any;
}

function createMockTypeLiteralNode(members: any[]): ts.TypeLiteralNode {
  return {
    kind: ts.SyntaxKind.TypeLiteral,
    members: members,
    getText: () => `{ ${members.map((m) => `${m.name.text}: any`).join('; ')} }`
  } as any;
}

function createMockPropertySignature(name: string, type: any): ts.PropertySignature {
  return {
    kind: ts.SyntaxKind.PropertySignature,
    name: createMockIdentifier(name),
    type: type,
    getText: () => `${name}: ${type.text || 'any'}`
  } as any;
}

function createMockTypeReferenceNode(typeName: string, typeArgs?: any[]): ts.TypeReferenceNode {
  return {
    kind: ts.SyntaxKind.TypeReference,
    typeName: createMockIdentifier(typeName),
    typeArguments: typeArgs,
    getText: () => {
      if (typeArgs && typeArgs.length > 0) {
        return `${typeName}<${typeArgs.map((arg) => (arg.getText ? arg.getText() : arg.text || 'any')).join(', ')}>`;
      }
      return typeName;
    }
  } as any;
}

function createMockKeywordTypeNode(kind: ts.SyntaxKind): ts.KeywordTypeNode {
  return {
    kind: kind,
    getText: () => {
      switch (kind) {
        case ts.SyntaxKind.StringKeyword:
          return 'string';
        case ts.SyntaxKind.NumberKeyword:
          return 'number';
        case ts.SyntaxKind.AnyKeyword:
          return 'any';
        case ts.SyntaxKind.BooleanKeyword:
          return 'boolean';
        case ts.SyntaxKind.UnknownKeyword:
          return 'unknown';
        case ts.SyntaxKind.ObjectKeyword:
          return 'object';
        default:
          return 'any';
      }
    }
  } as any;
}

function createMockLiteralTypeNode(literal: any): ts.LiteralTypeNode {
  return {
    kind: ts.SyntaxKind.LiteralType,
    literal: literal,
    typeArguments: undefined, // Specifically set this to undefined to trigger the error condition
    getText: () => {
      if (typeof literal.text === 'string') {
        return `"${literal.text}"`;
      }
      return String(literal);
    }
  } as any;
}

describe('handleModelPayload', () => {
  let mockWriter: DeclarationWriter;
  let mockModel: PrismaEntity;
  let mockConfig: PrismaJsonTypesGeneratorConfig;

  beforeEach(() => {
    mockWriter = {} as DeclarationWriter;
    mockModel = {
      type: 'model',
      name: 'User'
    } as PrismaEntity;
    mockConfig = {} as PrismaJsonTypesGeneratorConfig;

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should throw an error when provided type alias is not a type literal', () => {
    // Create a type alias with a non-type literal type (e.g. string literal)
    const stringLiteralNode = createMockLiteralTypeNode(createMockIdentifier('test'));
    const typeAlias = createMockTypeAliasDeclaration('UserPayload', stringLiteralNode);

    expect(() => {
      handleModelPayload(typeAlias, mockWriter, mockModel, mockConfig);
    }).toThrow(PrismaJsonTypesGeneratorError);
  });

  it('should return early when no scalars field is found', () => {
    // Create a type literal without scalars field
    const typeMembers = [
      createMockPropertySignature('objects', createMockTypeReferenceNode('SomeType'))
    ];
    const typeLiteral = createMockTypeLiteralNode(typeMembers);

    const typeAlias = createMockTypeAliasDeclaration('UserPayload', typeLiteral);

    const result = handleModelPayload(typeAlias, mockWriter, mockModel, mockConfig);
    expect(result).toBeUndefined();
    expect(mockReplaceObject).not.toHaveBeenCalled();
  });

  it('should throw an error when scalars field does not have a proper type', () => {
    // Create a type literal with a scalars field but no valid inner type
    // In the model case, it looks for typeArguments[0], which won't exist on a literal type
    const scalarsFieldType = createMockLiteralTypeNode(createMockIdentifier('invalid'));
    const typeMembers = [createMockPropertySignature('scalars', scalarsFieldType)];
    const typeLiteral = createMockTypeLiteralNode(typeMembers);

    const typeAlias = createMockTypeAliasDeclaration('UserPayload', typeLiteral);

    expect(() => {
      handleModelPayload(typeAlias, mockWriter, mockModel, mockConfig);
    }).toThrow(PrismaJsonTypesGeneratorError);
  });

  it('should call replaceObject with the correct object for model type', () => {
    // Create a complex type literal that represents the scalars field
    // with type arguments to simulate $Extensions.GetResult<OBJECT, ExtArgs...>
    const mockInnerObjectType = createMockTypeLiteralNode([
      createMockPropertySignature('id', createMockKeywordTypeNode(ts.SyntaxKind.StringKeyword))
    ]);

    // Create a type reference that looks like $Extensions.GetResult<OBJECT_TYPE, OTHER_ARG>
    const getResultsType = createMockTypeReferenceNode('$Extensions.GetResult', [
      mockInnerObjectType,
      createMockKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    ]);

    const typeMembers = [createMockPropertySignature('scalars', getResultsType)];
    const typeLiteral = createMockTypeLiteralNode(typeMembers);

    const typeAlias = createMockTypeAliasDeclaration('UserPayload', typeLiteral);

    handleModelPayload(typeAlias, mockWriter, mockModel, mockConfig);

    expect(mockReplaceObject).toHaveBeenCalledWith(
      mockInnerObjectType,
      mockWriter,
      mockModel,
      mockConfig
    );
  });

  it('should call replaceObject for composite types without type arguments', () => {
    // For composite types, the scalars field does not have type arguments
    const mockObjectType = createMockTypeLiteralNode([
      createMockPropertySignature('field', createMockKeywordTypeNode(ts.SyntaxKind.StringKeyword))
    ]);

    // Create a direct type literal for composite types
    const typeMembers = [createMockPropertySignature('scalars', mockObjectType)];
    const typeLiteral = createMockTypeLiteralNode(typeMembers);

    // Set model type to type
    mockModel.type = 'type';

    const typeAlias = createMockTypeAliasDeclaration('TypePayload', typeLiteral);

    handleModelPayload(typeAlias, mockWriter, mockModel, mockConfig);

    expect(mockReplaceObject).toHaveBeenCalledWith(
      mockObjectType,
      mockWriter,
      mockModel,
      mockConfig
    );
  });

  it('should handle type literals with multiple fields correctly', () => {
    const mockInnerObjectType = createMockTypeLiteralNode([
      createMockPropertySignature('id', createMockKeywordTypeNode(ts.SyntaxKind.NumberKeyword))
    ]);

    const getResultsType = createMockTypeReferenceNode('$Extensions.GetResult', [
      mockInnerObjectType,
      createMockKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
    ]);

    const typeMembers = [
      createMockPropertySignature('scalars', getResultsType),
      createMockPropertySignature(
        'objects',
        createMockKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
      ),
      createMockPropertySignature('name', createMockKeywordTypeNode(ts.SyntaxKind.StringKeyword)),
      createMockPropertySignature(
        'composites',
        createMockKeywordTypeNode(ts.SyntaxKind.ObjectKeyword)
      )
    ];
    const typeLiteral = createMockTypeLiteralNode(typeMembers);

    const typeAlias = createMockTypeAliasDeclaration('ComplexPayload', typeLiteral);

    handleModelPayload(typeAlias, mockWriter, mockModel, mockConfig);

    expect(mockReplaceObject).toHaveBeenCalledWith(
      mockInnerObjectType,
      mockWriter,
      mockModel,
      mockConfig
    );
  });

  it('should properly extract object type from nested structure', () => {
    // Test with a more complex nested structure to ensure proper parsing
    const deeplyNestedType = createMockTypeLiteralNode([
      createMockPropertySignature(
        'nestedField',
        createMockKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      )
    ]);

    const outerType = createMockTypeReferenceNode('OuterType', [deeplyNestedType]);

    const getResultsType = createMockTypeReferenceNode('$Extensions.GetResult', [
      outerType,
      createMockKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    ]);

    const typeMembers = [createMockPropertySignature('scalars', getResultsType)];
    const typeLiteral = createMockTypeLiteralNode(typeMembers);

    const typeAlias = createMockTypeAliasDeclaration('NestedPayload', typeLiteral);

    handleModelPayload(typeAlias, mockWriter, mockModel, mockConfig);

    // The function should pass the outerType (which wraps the deeplyNestedType) to replaceObject
    expect(mockReplaceObject).toHaveBeenCalledWith(outerType, mockWriter, mockModel, mockConfig);
  });
});
