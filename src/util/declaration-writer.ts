import fs from 'node:fs/promises';
import type { PrismaJsonTypesGeneratorConfig } from './config';
import { NAMESPACE_PATH } from './constants';
import { PrismaJsonTypesGeneratorError } from './error';
import { findFirstCodeIndex } from './source-path';

/** A changes made in the original file to help adjust any future coordinates of texts */
export interface TextDiff {
  start: number;
  diff: number;
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

    // Appends PJTG import statement
    if (this.multifile) {
      const ext = this.importFileExtension ? `.${this.importFileExtension}` : '';
      header = `import type * as PJTG from '../pjtg${ext}';`;
    } else {
      header = await getNamespacePrelude(this.options.namespace);
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
    // Resets current changeset and file content
    this.content = await this.template();
    this.changeset = [];

    // Writes it into the disk
    await fs.writeFile(this.filepath, this.content);
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
    // Adds a trailing space
    if (text[0] !== ' ') {
      text = ` ${text}`;
    }

    // Maps the coordinates to the previous changes to adjust the position for the new text
    for (const change of this.changeset) {
      if (start > change.start) {
        start += change.diff;
        end += change.diff;
      }
    }

    // Replaces the file content at the correct position
    this.content = this.content.slice(0, start) + text + this.content.slice(end);

    // Adds the change to the list
    this.changeset.push({
      start,
      // The difference between the old text and the new text
      diff: start - end + text.length
    });
  }
}

export async function getNamespacePrelude(namespace: string) {
  let prelude = await fs.readFile(NAMESPACE_PATH, 'utf-8');

  // Removes trailing spaces
  prelude = prelude.trim();

  // Replaces the namespace with the provided namespace
  prelude = prelude.replace(/\$\$NAMESPACE\$\$/g, namespace);

  return prelude;
}
