import fs from 'node:fs/promises';
import { NAMESPACE_PATH } from './constants';
import { DeclarationWriter, getNamespacePrelude } from './declaration-writer';

// Mock fs module
jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  stat: jest.fn()
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('DeclarationWriter', () => {
  const mockFilepath = '/mock/path/index.d.ts';
  const mockConfig = { namespace: 'TestNamespace' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'ts');

      expect(writer.filepath).toBe(mockFilepath);
      // Skip checking private property
      expect(writer.multifile).toBe(true);
      expect(writer.importFileExtension).toBe('ts');
      expect(writer.content).toBe('');
      expect(writer.changes).toEqual([]);
    });

    it('should work with undefined import file extension', () => {
      const writer = new DeclarationWriter(mockFilepath, mockConfig, false, undefined);

      expect(writer.filepath).toBe(mockFilepath);
      expect(writer.multifile).toBe(false);
      expect(writer.importFileExtension).toBeUndefined();
    });
  });

  describe('load', () => {
    it('should load file content when file exists', async () => {
      const fileContent = 'some content here';
      mockedFs.stat.mockResolvedValue({} as any);
      mockedFs.readFile.mockResolvedValue(fileContent);

      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'ts');
      await writer.load();

      expect(mockedFs.stat).toHaveBeenCalledWith(mockFilepath);
      expect(mockedFs.readFile).toHaveBeenCalledWith(mockFilepath, 'utf-8');
      expect(writer.content).toBe(fileContent);
    });

    it('should throw error when file does not exist', async () => {
      mockedFs.stat.mockResolvedValue(null as any);

      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'ts');

      await expect(writer.load()).rejects.toThrow('Tried to load a file that does not exist');
    });

    it('should throw error when trying to load file with existing changes', async () => {
      mockedFs.stat.mockResolvedValue({} as any);
      mockedFs.readFile.mockResolvedValue('content');

      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'ts');
      writer.replace(0, 5, 'new text'); // Add a change

      await expect(writer.load()).rejects.toThrow(
        'Tried to load a file that has already been changed'
      );
    });
  });

  describe('template', () => {
    it('should generate correct template for multifile mode', async () => {
      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'ts');
      writer.content = `// Some comments
export declare const value: string;`;

      const result = await writer.template();

      expect(result).toContain("import type * as PJTG from '../pjtg.ts';");
      expect(result).toContain('// Some comments');
      expect(result).toContain('export declare const value: string;');
    });

    it('should generate correct template for single file mode', async () => {
      const mockNamespaceContent = `declare global {
  namespace $$NAMESPACE$$ {
    // namespace content
  }
}`;

      mockedFs.readFile.mockResolvedValue(mockNamespaceContent);

      const writer = new DeclarationWriter(mockFilepath, mockConfig, false, 'ts');
      writer.content = `// Some comments
export declare const value: string;`;

      const result = await writer.template();

      expect(result).toContain('declare global {');
      expect(result).toContain('namespace TestNamespace');
      expect(result).toContain('// Some comments');
      expect(result).toContain('export declare const value: string;');
    });

    it('should handle different import file extensions', async () => {
      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'js');
      writer.content = `export declare const value: string;`;

      const result = await writer.template();

      expect(result).toContain("import type * as PJTG from '../pjtg.js'");
    });

    it('should handle undefined import file extension', async () => {
      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, undefined);
      writer.content = `export declare const value: string;`;

      const result = await writer.template();

      expect(result).toContain("import type * as PJTG from '../pjtg'");
    });

    it('should place header after initial comments', async () => {
      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'ts');
      writer.content = `// @ts-nocheck
// This is a comment
export declare const value: string;`;

      const result = await writer.template();

      expect(result).toContain('// @ts-nocheck');
      expect(result).toContain('// This is a comment');
      expect(result).toContain("import type * as PJTG from '../pjtg.ts'");
      expect(result).toContain('export declare const value: string;');
    });

    it('should handle block comments correctly', async () => {
      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'ts');
      writer.content = `/* This is a block comment
   that spans multiple lines */
// Line comment
export declare const value: string;`;

      const result = await writer.template();

      expect(result).toContain('/* This is a block comment');
      expect(result).toContain('// Line comment');
      expect(result).toContain("import type * as PJTG from '../pjtg.ts'");
      expect(result).toContain('export declare const value: string;');
      // Verify that the header is placed right after comments
      const headerPosition = result.indexOf("import type * as PJTG from '../pjtg.ts'");
      const codePosition = result.indexOf('export declare const value: string;');
      const commentEnd = result.indexOf('*/') + 2; // End of block comment

      expect(headerPosition).toBeGreaterThan(commentEnd); // Header comes after comments
      expect(codePosition).toBeGreaterThan(headerPosition); // Code comes after header
    });

    it('should place header at beginning if no comments exist', async () => {
      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'ts');
      writer.content = `export declare const value: string;`;

      const result = await writer.template();

      const firstImportIndex = result.indexOf("import type * as PJTG from '../pjtg.ts'");
      const firstExportIndex = result.indexOf('export declare const value: string;');

      expect(firstImportIndex).toBeLessThan(firstExportIndex);
      expect(result).toContain("import type * as PJTG from '../pjtg.ts'");
      expect(result).toContain('export declare const value: string;');
    });
  });

  describe('replace', () => {
    it('should add changes to the changes array', () => {
      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'ts');

      writer.replace(0, 5, 'new text');
      writer.replace(10, 15, 'another text');

      expect(writer.changes).toHaveLength(2);
      expect(writer.changes[0]).toEqual({ start: 0, end: 5, text: 'new text' });
      expect(writer.changes[1]).toEqual({ start: 10, end: 15, text: 'another text' });
    });
  });

  describe('save', () => {
    it('should save file with applied changes and template', async () => {
      const mockNamespaceContent = `declare global {
  namespace $$NAMESPACE$$ {
    // namespace content
  }
}`;
      mockedFs.readFile.mockResolvedValue(mockNamespaceContent);
      mockedFs.writeFile.mockResolvedValue();

      const writer = new DeclarationWriter(mockFilepath, mockConfig, false, 'ts');
      writer.content = `// Some comments
export declare const value: string;`;

      writer.replace(20, 25, 'newValue'); // Replace 'value' with 'newValue'

      await writer.save();

      expect(mockedFs.writeFile).toHaveBeenCalled();
      // Check that changes were applied and template was processed
      const writeCallArgs = mockedFs.writeFile.mock.calls[0];
      if (writeCallArgs) {
        const savedContent = writeCallArgs[1];
        expect(savedContent).toContain('declare global {');
        expect(savedContent).toContain('namespace TestNamespace');
        expect(savedContent).toContain('newValue'); // The replaced value should be there
      }
    });

    it('should save file without changes when changes array is empty', async () => {
      const mockNamespaceContent = `declare global {
  namespace $$NAMESPACE$$ {
    // namespace content
  }
}`;
      mockedFs.readFile.mockResolvedValue(mockNamespaceContent);
      mockedFs.writeFile.mockResolvedValue();

      const writer = new DeclarationWriter(mockFilepath, mockConfig, false, 'ts');
      writer.content = `// Some comments
export declare const value: string;`;

      await writer.save();

      expect(mockedFs.writeFile).toHaveBeenCalled();
      const writeCallArgs = mockedFs.writeFile.mock.calls[0];
      if (writeCallArgs) {
        const savedContent = writeCallArgs[1];
        expect(savedContent).toContain('declare global {');
        expect(savedContent).toContain('namespace TestNamespace');
        expect(savedContent).toContain('export declare const value: string;');
      }
    });

    it('should save file in multifile mode', async () => {
      mockedFs.writeFile.mockResolvedValue();

      const writer = new DeclarationWriter(mockFilepath, mockConfig, true, 'ts');
      writer.content = `// Some comments
export declare const value: string;`;

      await writer.save();

      expect(mockedFs.writeFile).toHaveBeenCalled();
      const writeCallArgs = mockedFs.writeFile.mock.calls[0];
      if (writeCallArgs) {
        const savedContent = writeCallArgs[1];
        expect(savedContent).toContain("import type * as PJTG from '../pjtg.ts'");
        expect(savedContent).toContain('export declare const value: string;');
      }
    });
  });
});

describe('getNamespacePrelude', () => {
  const mockNamespacePathContent = `declare global {
  namespace $$NAMESPACE$$ {
    // namespace content
  }
}

/** Some type definitions */
export type SomeType = string;
`;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.readFile.mockResolvedValue(mockNamespacePathContent);
  });

  it('should replace namespace placeholder with actual namespace', async () => {
    const result = await getNamespacePrelude({
      namespace: 'CustomNamespace',
      isNewClient: false,
      dotExt: '.ts'
    });

    expect(mockedFs.readFile).toHaveBeenCalledWith(NAMESPACE_PATH, 'utf-8');
    expect(result).toContain('declare global {');
    expect(result).toContain('namespace CustomNamespace');
    expect(result).toContain('// namespace content');
    expect(result).toContain('export type SomeType = string;');
    expect(result).not.toContain('$$NAMESPACE$$');
  });

  it('should trim trailing spaces', async () => {
    const spacedContent = `

declare global {
  namespace $$NAMESPACE$$ {
    // namespace content
  }
}


`;
    mockedFs.readFile.mockResolvedValue(spacedContent);

    const result = await getNamespacePrelude({
      namespace: 'TestNs',
      isNewClient: false,
      dotExt: '.ts'
    });

    expect(result).toBe(`declare global {
  namespace TestNs {
    // namespace content
  }
}`);
  });

  it('should add Prisma import for new client', async () => {
    const result = await getNamespacePrelude({
      namespace: 'TestNs',
      isNewClient: true,
      dotExt: '.ts'
    });

    expect(result).toContain("import * as Prisma from './internal/prismaNamespace.ts'");
    expect(result).toContain('declare global {');
    expect(result).toContain('namespace TestNs');
  });

  it('should not add Prisma import for old client', async () => {
    const result = await getNamespacePrelude({
      namespace: 'TestNs',
      isNewClient: false,
      dotExt: '.ts'
    });

    expect(result).not.toContain("import * as Prisma from './internal/prismaNamespace.ts'");
    expect(result).toContain('declare global {');
    expect(result).toContain('namespace TestNs');
  });

  it('should use correct extension in import for new client', async () => {
    const result = await getNamespacePrelude({
      namespace: 'TestNs',
      isNewClient: true,
      dotExt: '.js'
    });

    expect(result).toContain("import * as Prisma from './internal/prismaNamespace.js'");
    expect(result).toContain('declare global {');
    expect(result).toContain('namespace TestNs');
  });

  it('should work with different extensions', async () => {
    const result = await getNamespacePrelude({
      namespace: 'AnotherNs',
      isNewClient: true,
      dotExt: '.d.ts'
    });

    expect(result).toContain("import * as Prisma from './internal/prismaNamespace.d.ts'");
    expect(result).toContain('declare global {');
    expect(result).toContain('namespace AnotherNs');
  });
});
