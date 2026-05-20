import ts from 'typescript';
import type { PrismaEntity } from '../helpers/dmmf';
import type { PrismaJsonTypesGeneratorConfig } from '../util/config';
import type { DeclarationWriter } from '../util/declaration-writer';
import { replaceObject } from './replace-object';

// Mock the dependencies
jest.mock('../helpers/find-signature');
jest.mock('../helpers/type-parser');
jest.mock('../util/create-signature');
jest.mock('../util/declaration-writer');

import { findNewSignature } from '../helpers/find-signature';
import { parseTypeSyntax } from '../helpers/type-parser';
import { createType } from '../util/create-signature';

describe('replaceObject', () => {
  let mockObject: ts.TypeLiteralNode;
  let mockWriter: jest.Mocked<DeclarationWriter>;
  let mockModel: jest.Mocked<PrismaEntity>;
  let mockConfig: jest.Mocked<PrismaJsonTypesGeneratorConfig>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock object with members - properly typed as TypeLiteralNode
    mockObject = {
      members: [
        {
          kind: ts.SyntaxKind.PropertySignature,
          name: { getText: () => 'testField' } as ts.Identifier,
          type: { getText: () => 'string', pos: 0, end: 10 } as ts.TypeNode
        } as ts.PropertySignature
      ],
      kind: ts.SyntaxKind.TypeLiteral,
      _typeNodeBrand: undefined!,
      flags: ts.NodeFlags.None,
      parent: {} as ts.Node,
      pos: 0,
      end: 0,
      forEachChild: jest.fn(),
      getSourceFile: jest.fn(),
      getChildCount: jest.fn(),
      getChildren: jest.fn(),
      getStart: jest.fn(),
      getFullStart: jest.fn(),
      getEnd: jest.fn(),
      getWidth: jest.fn(),
      getFullWidth: jest.fn(),
      getLeadingTriviaWidth: jest.fn(),
      getFullText: jest.fn(),
      getText: jest.fn(),
      getFirstToken: jest.fn(),
      getLastToken: jest.fn(),
      isTypeOf: jest.fn(),
      isInstanceOf: jest.fn(),
      isArrayLike: jest.fn()
    } as unknown as ts.TypeLiteralNode;

    mockWriter = {
      replace: jest.fn(),
      multifile: false,
      filepath: 'test.d.ts',
      content: '',
      template: jest.fn(),
      load: jest.fn(),
      save: jest.fn()
    } as any as jest.Mocked<DeclarationWriter>;

    mockModel = {
      fields: [
        {
          name: 'testField',
          documentation: '@JSON string'
        }
      ] as any,
      name: 'TestModel'
    } as jest.Mocked<PrismaEntity>;

    mockConfig = {
      allowAny: false
    } as jest.Mocked<PrismaJsonTypesGeneratorConfig>;
  });

  it('should continue processing when field name does not match member name', () => {
    // Change model field name to not match member name by creating new mock
    const mockModelWithDifferentField = {
      fields: [{ name: 'differentFieldName', documentation: '@JSON string' }] as any,
      name: 'TestModel'
    } as jest.Mocked<PrismaEntity>;

    replaceObject(mockObject, mockWriter, mockModelWithDifferentField, mockConfig);

    expect(mockWriter.replace).not.toHaveBeenCalled();
  });

  it('should replace object properties based on model fields', () => {
    // Setup mocks
    (parseTypeSyntax as jest.Mock).mockReturnValue({ type: 'string' });
    (createType as jest.Mock).mockReturnValue('string');
    (findNewSignature as jest.Mock).mockReturnValue('string');

    replaceObject(mockObject, mockWriter, mockModel, mockConfig);

    expect(parseTypeSyntax).toHaveBeenCalledWith('@JSON string');
    expect(createType).toHaveBeenCalledWith('@JSON string', mockConfig);
    expect(findNewSignature).toHaveBeenCalled();
    expect(mockWriter.replace).toHaveBeenCalled();
  });

  it('should skip fields not annotated with JSON comment when allowAny is true', () => {
    // Modify the config to allowAny
    mockConfig.allowAny = true;
    (parseTypeSyntax as jest.Mock).mockReturnValue(null); // Return null meaning not annotated

    replaceObject(mockObject, mockWriter, mockModel, mockConfig);

    expect(mockWriter.replace).not.toHaveBeenCalled();
  });

  it('should continue processing when member is not a PropertySignature', () => {
    // Modify object member to not be PropertySignature - creating a new properly typed mock
    const mockObjectWithMethod: ts.TypeLiteralNode = {
      members: [
        {
          kind: ts.SyntaxKind.MethodSignature, // Not PropertySignature
          name: { getText: () => 'testField' } as ts.Identifier
        } as ts.TypeElement // Use TypeElement which is the base type
      ],
      kind: ts.SyntaxKind.TypeLiteral,
      _typeNodeBrand: undefined!,
      flags: ts.NodeFlags.None,
      parent: {} as ts.Node,
      pos: 0,
      end: 0,
      forEachChild: jest.fn(),
      getSourceFile: jest.fn(),
      getChildCount: jest.fn(),
      getChildren: jest.fn(),
      getStart: jest.fn(),
      getFullStart: jest.fn(),
      getEnd: jest.fn(),
      getWidth: jest.fn(),
      getFullWidth: jest.fn(),
      getLeadingTriviaWidth: jest.fn(),
      getFullText: jest.fn(),
      getText: jest.fn(),
      getFirstToken: jest.fn(),
      getLastToken: jest.fn(),
      isTypeOf: jest.fn(),
      isInstanceOf: jest.fn(),
      isArrayLike: jest.fn()
    } as unknown as ts.TypeLiteralNode;

    replaceObject(mockObjectWithMethod, mockWriter, mockModel, mockConfig);

    expect(mockWriter.replace).not.toHaveBeenCalled();
  });

  it('should continue processing when field name does not match member name', () => {
    // Change model field name to not match member name by creating new mock
    const mockModelWithDifferentName = {
      fields: [{ name: 'differentFieldName', documentation: '@JSON string' }] as any,
      name: 'TestModel'
    } as jest.Mocked<PrismaEntity>;

    replaceObject(mockObject, mockWriter, mockModelWithDifferentName, mockConfig);

    expect(mockWriter.replace).not.toHaveBeenCalled();
  });

  it('should throw error when signature type is not found', () => {
    // Create object member without type
    const mockObjectWithoutType: ts.TypeLiteralNode = {
      members: [
        {
          kind: ts.SyntaxKind.PropertySignature,
          name: { getText: () => 'testField' } as ts.Identifier,
          type: undefined // No type defined
        } as ts.PropertySignature
      ],
      kind: ts.SyntaxKind.TypeLiteral,
      _typeNodeBrand: undefined!,
      flags: ts.NodeFlags.None,
      parent: {} as ts.Node,
      pos: 0,
      end: 0,
      forEachChild: jest.fn(),
      getSourceFile: jest.fn(),
      getChildCount: jest.fn(),
      getChildren: jest.fn(),
      getStart: jest.fn(),
      getFullStart: jest.fn(),
      getEnd: jest.fn(),
      getWidth: jest.fn(),
      getFullWidth: jest.fn(),
      getLeadingTriviaWidth: jest.fn(),
      getFullText: jest.fn(),
      getText: jest.fn(),
      getFirstToken: jest.fn(),
      getLastToken: jest.fn(),
      isTypeOf: jest.fn(),
      isInstanceOf: jest.fn(),
      isArrayLike: jest.fn()
    } as unknown as ts.TypeLiteralNode;

    expect(() => {
      replaceObject(mockObjectWithoutType, mockWriter, mockModel, mockConfig);
    }).toThrow('Could not find signature type');
  });

  it('should handle when createType returns unknown', () => {
    (parseTypeSyntax as jest.Mock).mockReturnValue({ type: 'string' });
    (createType as jest.Mock).mockReturnValue('unknown'); // Return unknown
    (findNewSignature as jest.Mock).mockReturnValue('unknown');

    replaceObject(mockObject, mockWriter, mockModel, mockConfig);

    // Should still call findNewSignature but with different parameters for ignoring errors
    expect(findNewSignature).toHaveBeenCalledWith(
      expect.any(String),
      'unknown',
      'TestModel',
      'testField',
      false, // ignore not found errors when defaulted to unknown
      false, // ignore not found errors when defaulted to unknown
      expect.any(String)
    );
  });

  it('should skip replacement when findNewSignature returns null', () => {
    (parseTypeSyntax as jest.Mock).mockReturnValue({ type: 'string' });
    (createType as jest.Mock).mockReturnValue('string');
    (findNewSignature as jest.Mock).mockReturnValue(null); // Return null to skip

    replaceObject(mockObject, mockWriter, mockModel, mockConfig);

    expect(mockWriter.replace).not.toHaveBeenCalled();
  });

  it('should use multifile prefix correctly', () => {
    // Recreate the writer with multifile = true
    const mockWriterWithMultifile: jest.Mocked<DeclarationWriter> = {
      replace: jest.fn(),
      multifile: true,
      filepath: 'test.d.ts',
      content: '',
      template: jest.fn(),
      load: jest.fn(),
      save: jest.fn()
    } as any;

    (parseTypeSyntax as jest.Mock).mockReturnValue({ type: 'string' });
    (createType as jest.Mock).mockReturnValue('string');
    (findNewSignature as jest.Mock).mockReturnValue('string');

    replaceObject(mockObject, mockWriterWithMultifile, mockModel, mockConfig);

    expect(findNewSignature).toHaveBeenCalledWith(
      expect.any(String),
      'string',
      'TestModel',
      'testField',
      true,
      true,
      'PJTG.' // multifile prefix
    );
  });

  it('should process multiple fields', () => {
    const mockObjectWithMultipleFields: ts.TypeLiteralNode = {
      members: [
        {
          kind: ts.SyntaxKind.PropertySignature,
          name: { getText: () => 'field1' } as ts.Identifier,
          type: { getText: () => 'string', pos: 0, end: 10 } as ts.TypeNode
        } as ts.PropertySignature,
        {
          kind: ts.SyntaxKind.PropertySignature,
          name: { getText: () => 'field2' } as ts.Identifier,
          type: { getText: () => 'number', pos: 11, end: 20 } as ts.TypeNode
        } as ts.PropertySignature
      ],
      kind: ts.SyntaxKind.TypeLiteral,
      _typeNodeBrand: undefined!,
      flags: ts.NodeFlags.None,
      parent: {} as ts.Node,
      pos: 0,
      end: 0,
      forEachChild: jest.fn(),
      getSourceFile: jest.fn(),
      getChildCount: jest.fn(),
      getChildren: jest.fn(),
      getStart: jest.fn(),
      getFullStart: jest.fn(),
      getEnd: jest.fn(),
      getWidth: jest.fn(),
      getFullWidth: jest.fn(),
      getLeadingTriviaWidth: jest.fn(),
      getFullText: jest.fn(),
      getText: jest.fn(),
      getFirstToken: jest.fn(),
      getLastToken: jest.fn(),
      isTypeOf: jest.fn(),
      isInstanceOf: jest.fn(),
      isArrayLike: jest.fn()
    } as unknown as ts.TypeLiteralNode;

    const mockModelWithMultipleFields = {
      fields: [
        { name: 'field1', documentation: '@JSON string' },
        { name: 'field2', documentation: '@JSON number' }
      ] as any,
      name: 'TestModel'
    } as jest.Mocked<PrismaEntity>;

    (parseTypeSyntax as jest.Mock).mockReturnValue({ type: 'any' });
    (createType as jest.Mock).mockReturnValue('any');
    (findNewSignature as jest.Mock).mockReturnValue('any');

    replaceObject(
      mockObjectWithMultipleFields,
      mockWriter,
      mockModelWithMultipleFields,
      mockConfig
    );

    expect(mockWriter.replace).toHaveBeenCalledTimes(2);
  });

  it('should handle complex type literals with mixed members', () => {
    const mockObjectComplex: ts.TypeLiteralNode = {
      members: [
        {
          kind: ts.SyntaxKind.PropertySignature,
          name: { getText: () => 'validField' } as ts.Identifier,
          type: { getText: () => 'string', pos: 0, end: 10 } as ts.TypeNode
        } as ts.PropertySignature,
        {
          kind: ts.SyntaxKind.MethodSignature, // Invalid kind
          name: { getText: () => 'methodMember' } as ts.Identifier
        } as ts.MethodSignature,
        {
          kind: ts.SyntaxKind.PropertySignature,
          name: { getText: () => 'invalidName' } as ts.Identifier, // Different name
          type: { getText: () => 'number', pos: 20, end: 30 } as ts.TypeNode
        } as ts.PropertySignature
      ],
      kind: ts.SyntaxKind.TypeLiteral,
      _typeNodeBrand: undefined!,
      flags: ts.NodeFlags.None,
      parent: {} as ts.Node,
      pos: 0,
      end: 0,
      forEachChild: jest.fn(),
      getSourceFile: jest.fn(),
      getChildCount: jest.fn(),
      getChildren: jest.fn(),
      getStart: jest.fn(),
      getFullStart: jest.fn(),
      getEnd: jest.fn(),
      getWidth: jest.fn(),
      getFullWidth: jest.fn(),
      getLeadingTriviaWidth: jest.fn(),
      getFullText: jest.fn(),
      getText: jest.fn(),
      getFirstToken: jest.fn(),
      getLastToken: jest.fn(),
      isTypeOf: jest.fn(),
      isInstanceOf: jest.fn(),
      isArrayLike: jest.fn()
    } as unknown as ts.TypeLiteralNode;

    const mockModelValidField = {
      fields: [{ name: 'validField', documentation: '@JSON string' }] as any,
      name: 'TestModel'
    } as jest.Mocked<PrismaEntity>;

    (parseTypeSyntax as jest.Mock).mockReturnValue({ type: 'string' });
    (createType as jest.Mock).mockReturnValue('string');
    (findNewSignature as jest.Mock).mockReturnValue('string');

    replaceObject(mockObjectComplex, mockWriter, mockModelValidField, mockConfig);

    // Only the valid field should have been processed
    expect(mockWriter.replace).toHaveBeenCalledTimes(1);
  });
});
