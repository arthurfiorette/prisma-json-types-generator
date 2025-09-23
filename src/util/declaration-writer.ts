import fs from 'node:fs/promises';
import type { PrismaJsonTypesGeneratorConfig } from './config';
import { NAMESPACE_PATH } from './constants';
import { PrismaJsonTypesGeneratorError } from './error';
import { findFirstCodeIndex } from './source-path';

/** A changes made in the original file to help adjust any future coordinates of texts */
export interface TextDiff {
  start: number;
  end: number;
  replacementText: string;
}

/**
 * A class to help with reading and writing the Prisma Client types file concurrently and
 * converting positions indexes according with previous changes.
 */
export class DeclarationWriter {
  constructor(
    readonly filepath: string,
    private readonly options: PrismaJsonTypesGeneratorConfig,
    readonly multifile: boolean,
    private readonly importFileExtension: string | undefined
  ) {}

  /** The prisma's index.d.ts file content. */
  public content = '';

  private changeset: TextDiff[] = [];

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

    if (this.changeset.length) {
      throw new PrismaJsonTypesGeneratorError(
        'Tried to load a file that has already been changed',
        { filepath: this.filepath, changeset: this.changeset }
      );
    }

    this.content = await fs.readFile(this.filepath, 'utf-8');
  }

  /** Save the original file of sourcePath with the content's contents */
  async save() {
    const startSort = Date.now();

    const sortedChangeSet = [...this.changeset].sort(
      (changeA, changeB) => changeA.start - changeB.start
    );

    console.log('sort changes', Date.now() - startSort);

    const startReplace = Date.now();

    // Optimized string replacement using array-based approach
    const content = this.applyChangesOptimized(this.content, sortedChangeSet);

    console.log('replace changes', Date.now() - startReplace);

    this.content = content;
    this.changeset = [];

    // Apply template after all changes
    this.content = await this.template();

    // Writes it into the disk
    await fs.writeFile(this.filepath, this.content);
  }

  /**
   * Optimized method to apply multiple text changes efficiently.
   * Uses array-based approach to avoid quadratic string concatenation.
   */
  private applyChangesOptimized(originalContent: string, sortedChanges: TextDiff[]): string {
    if (sortedChanges.length === 0) {
      return originalContent;
    }

    const segments: string[] = [];
    let lastEnd = 0;

    for (const change of sortedChanges) {
      // Add the unchanged content before this change
      if (change.start > lastEnd) {
        segments.push(originalContent.substring(lastEnd, change.start));
      }

      // Add the replacement text
      segments.push(change.replacementText);

      // Update the position for the next iteration
      lastEnd = change.end;
    }

    // Add any remaining content after the last change
    if (lastEnd < originalContent.length) {
      segments.push(originalContent.substring(lastEnd));
    }

    // Join all segments once at the end
    return segments.join('');
  }

  /**
   * Replaces the coordinates with the provided text, adjusting the coords to previous
   * changes.
   *
   * @example
   *
   * ```txt
   *  a 1   1 a
   *  s 2   2 s
   *  d 3   3 s <- (start: 1, end: 3, text: `s`) changed `s` to `ss` (start: 1, wide: 2)
   *    4   4 d
   *    5   5
   *  a 6   6
   *  s 7   7 a
   *  d 8   8 s
   *    9   9 d
   * ```
   */
  replace(start: number, end: number, text: string) {
    // Adds the change to the list
    this.changeset.push({
      start,
      end,
      replacementText: text
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
