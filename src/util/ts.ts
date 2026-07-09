import type TS from 'typescript';

/** Checks that a module exposes the compiler API members this generator uses. */
function hasCompilerApi(mod: unknown): mod is typeof TS {
  return (
    typeof mod === 'object' &&
    mod !== null &&
    typeof (mod as typeof TS).createSourceFile === 'function' &&
    typeof (mod as typeof TS).isStatement === 'function' &&
    typeof (mod as typeof TS).SyntaxKind === 'object'
  );
}

/**
 * Resolves the TypeScript compiler API used to parse the generated client declarations.
 *
 * TypeScript 6 exposes it from the `typescript` package itself. TypeScript 7 (the native
 * compiler) no longer ships a JS API, so we fall back to `@typescript/typescript6`,
 * Microsoft's compatibility package that re-exports the TypeScript 6 API.
 */
function loadCompilerApi(): typeof TS {
  try {
    const ts = require('typescript');

    if (hasCompilerApi(ts)) {
      return ts;
    }
  } catch {}

  try {
    const ts6 = require('@typescript/typescript6');

    if (hasCompilerApi(ts6)) {
      return ts6;
    }
  } catch {}

  throw new Error(
    `prisma-json-types-generator requires the TypeScript compiler API, but the installed 'typescript' package does not provide it.
TypeScript 7 no longer ships the JS compiler API this generator uses. Install the official compatibility package:

  npm install -D @typescript/typescript6
`
  );
}

// Resolved at module load so a missing compiler API fails `prisma generate` loudly
// instead of being swallowed by onGenerate's catch-all error handler.
export default loadCompilerApi();
