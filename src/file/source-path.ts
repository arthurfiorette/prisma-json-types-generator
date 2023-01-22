import path from 'path';

export function getSourcePath(
  clientOutput: string,
  overrideTarget?: string,
  schemaTarget?: string
) {
  if (overrideTarget) {
    // schema relative
    if (overrideTarget.startsWith('./')) {
      return path.resolve(schemaTarget!, overrideTarget);
    }

    // importable
    return require.resolve(overrideTarget);
  }

  return path.resolve(
    // prisma client directory
    path.dirname(
      // We cannot directly resolve .prisma/client because pnpm uses a different directory structure,
      // so we find @prisma/client path and resolve the parent directory
      require.resolve(path.resolve(clientOutput, '../../.prisma/client'))
    ),
    'index.d.ts'
  );
}
