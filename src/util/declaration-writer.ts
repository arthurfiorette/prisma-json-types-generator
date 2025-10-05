import fs from 'node:fs/promises';
import type { PrismaJsonTypesGeneratorConfig } from './config';
import { NAMESPACE_PATH } from './constants';
import { PrismaJsonTypesGeneratorError } from './error';
import { findFirstCodeIndex } from './source-path';
import { applyTextChanges, type TextDiff } from './text-changes';

/**
 * A class to help with reading and writing the Prisma Client types file concurrently and
 * converting positions indexes according with previous changes.
 */
export class DeclarationWriter {
  constructor(
    readonly filepath: string,
    private readonly options: Pick<PrismaJsonTypesGeneratorConfig, 'namespace'>,
    readonly multifile: boolean,
    private readonly importFileExtension: string | undefined
  ) {}

  /** The prisma's index.d.ts file content. */
  public content = '';

  private changes: TextDiff[] = [];

  async template() {
    let header: string;

    const dotExt = this.importFileExtension ? `.${this.importFileExtension}` : '';

    // Appends PJTG import statement
    if (this.multifile) {
      header = `import type * as PJTG from '../pjtg${dotExt}';`;
    } else {
      header = await getNamespacePrelude({
        namespace: this.options.namespace,
        isNewClient: false,
        dotExt
      });
    }

    // wraps into extra lines to visually split our code from the rest
    header = `\n${header}\n`;

    const firstNonCommentLine = findFirstCodeIndex(this.content);

    // Appends after all initial comments to preserve comments like `@ts-nocheck`
    return (
      this.content.slice(0, firstNonCommentLine) + header + this.content.slice(firstNonCommentLine)
    );
  }

  /** Loads the original file of sourcePath into memory. */
  async load() {
    if (!(await fs.stat(this.filepath))) {
      throw new PrismaJsonTypesGeneratorError('Tried to load a file that does not exist', {
        filepath: this.filepath
      });
    }

    if (this.changes.length) {
      throw new PrismaJsonTypesGeneratorError(
        'Tried to load a file that has already been changed',
        { filepath: this.filepath, changeset: this.changes }
      );
    }

    this.content = await fs.readFile(this.filepath, 'utf-8');
  }

  /** Save the original file of sourcePath with the content's contents */
  async save() {
    // Apply all changes to content
    if (this.changes.length) {
      this.content = applyTextChanges(this.content, this.changes);
      this.changes.length = 0;
    }

    // Apply template after all changes
    this.content = await this.template();

    // Writes it into the disk
    await fs.writeFile(this.filepath, this.content);
  }

  /**
   * Stack change to be applied before declaration save
   */
  replace(start: number, end: number, text: string): void {
    // Adds the change to the list
    this.changes.push({
      start,
      end,
      text
    });
  }
}

export async function getNamespacePrelude({
  namespace,
  isNewClient,
  dotExt
}: {
  namespace: string;
  isNewClient: boolean;
  dotExt: string;
}) {
  let prelude = await fs.readFile(NAMESPACE_PATH, 'utf-8');

  // Removes trailing spaces
  prelude = prelude.trim();

  // Replaces the namespace with the provided namespace
  prelude = prelude.replace(/\$\$NAMESPACE\$\$/g, namespace);

  if (isNewClient) {
    prelude = `import * as Prisma from './internal/prismaNamespace${dotExt}';\n${prelude}`;
  }

  return prelude;
}
