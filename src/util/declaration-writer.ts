import fs from 'fs/promises';
import { createNamespace } from '../helpers/namespace';
import { buildTypesFilePath } from './source-path';

/**
 * A class to help with reading and writing the Prisma Client types file concurrently and
 * converting positions indexes according with previous changes.
 */
export class DeclarationWriter {
  constructor(clientOutput: string, overrideTarget?: string, schemaTarget?: string) {
    this.sourcePath = buildTypesFilePath(clientOutput, overrideTarget, schemaTarget);
  }

  /** Path to the original index.d.ts file */
  readonly sourcePath: string;

  /** The prisma's index.d.ts file content. */
  public content = '';

  /** A list of changes made in the original file to adjust any future coordinates of texts */
  private changeset: Array<{ start: number; diff: number }> = [];

  async load() {
    this.content = await fs.readFile(this.sourcePath, 'utf-8');
  }

  /** Updates the original file of sourcePath with the content's contents */
  async update(nsName: string) {
    await fs.writeFile(this.sourcePath, createNamespace(nsName) + this.content);
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
      text = ' ' + text;
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
