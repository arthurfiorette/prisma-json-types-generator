import path from 'node:path';

/**
 * Builds the full path to the correct Prisma Client types file.
 *
 * Normally located at `node_modules/.prisma/client/index.d.ts`
 */
export function buildTypesFilePath(
  clientOutput: string,
  overrideTarget?: string,
  schemaTarget?: string
) {
  // Just finds the default .prisma/client/index.d.ts
  if (!overrideTarget) {
    try {
      return path.resolve(
        // prisma client directory
        path.dirname(
          // We cannot directly resolve .prisma/client because pnpm uses a different directory structure,
          // so we find @prisma/client path and resolve the parent directory
          require.resolve(path.resolve(clientOutput, '../../.prisma/client'))
        ),
        'index.d.ts'
      );
    } catch {
      return path.resolve(
        // Complete filename?
        clientOutput.match(/\.(?:d\.ts|tsx?|jsx?)$/gm)
          ? // dirname
            path.dirname(clientOutput)
          : // filename
            clientOutput,
        'index.d.ts'
      );
    }
  }

  // Absolute path, just use it.
  if (path.isAbsolute(overrideTarget)) {
    return require.resolve(overrideTarget);
  }

  // Schema relative
  return path.resolve(
    // schemaTarget is the full path of the Prisma schema - we need the directory
    path.dirname(schemaTarget!),
    overrideTarget,
    // Works with `prisma-client` or `prisma-client-js`. the original path may not be called index.
    // If it ends with .ts, we don't need to add index.d.ts because it's use `prisma-client`
    overrideTarget.endsWith('.ts') ? '' : 'index.d.ts'
  );
}

export function findFirstCodeIndex(source: string) {
  let inBlockComment = false;
  let i = 0;

  while (i < source.length) {
    // Skip whitespace
    while (/\s/.test(source[i]!)) i++;

    // Handle line comments
    if (source.startsWith('//', i)) {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }

    // Handle block comments
    if (source.startsWith('/*', i)) {
      inBlockComment = true;
      i += 2;
      while (inBlockComment && i < source.length) {
        if (source.startsWith('*/', i)) {
          inBlockComment = false;
          i += 2;
          break;
        }
        i++;
      }
      continue;
    }

    // If not in a comment, return current index
    return i;
  }

  // no code found, return 0
  return 0;
}
