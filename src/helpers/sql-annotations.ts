import { parseTypeSyntax } from './type-parser';

/**
 * Parses result column annotations from the leading comment block of a TypedSQL file.
 *
 * Each annotation follows the same syntax as schema doc-comments, followed by the name of
 * the result column it applies to:
 *
 * ```sql
 * -- [Profile] profile
 * -- ![{ total: number }] "computed stats"
 * SELECT ...
 * ```
 *
 * Only the leading block is read because that is where prisma itself reads `@param` from,
 * and it is stripped from the query source prisma introspects. Lines whose remainder is
 * not exactly one column name (e.g. `-- [WIP] fix this later`) are treated as prose.
 *
 * @returns A map of result column name to its raw annotation (e.g. `[Profile]`)
 */
export function parseSqlAnnotations(sql: string): Map<string, string> {
  const annotations = new Map<string, string>();

  for (const rawLine of sql.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (!line.startsWith('--')) {
      break;
    }

    const comment = line.slice(2).trim();
    const parsed = parseTypeSyntax(comment);

    if (!parsed) {
      continue;
    }

    const column = parseColumnName(comment.slice(parsed.end).trim());

    if (column !== undefined) {
      annotations.set(column, comment.slice(0, parsed.end));
    }
  }

  return annotations;
}

/** Accepts a bare identifier or a double quoted one (with `""` escapes), like SQL does. */
function parseColumnName(text: string) {
  const quoted = text.match(/^"((?:[^"]|"")+)"$/);

  if (quoted) {
    return quoted[1]!.replace(/""/g, '"');
  }

  return /^[^\s"]+$/.test(text) ? text : undefined;
}
