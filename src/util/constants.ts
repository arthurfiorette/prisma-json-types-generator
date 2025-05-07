import path from 'node:path';

/** Name of the namespace in the type declaration */
export const PRISMA_NAMESPACE_NAME = 'Prisma';

/** The path to the namespace.d.ts file, used as a template for the prisma's index.d.ts */
export const NAMESPACE_PATH = path.resolve(__dirname, '../../assets/namespace.d.ts');

/** https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/null-and-undefined#strict-undefined-checks-preview-feature */
export const PRISMA_SKIP = ['| runtime.Types.Skip', '| $Types.Skip'];

/** Header to prepend to modified files */
export const MODIFIED_HEADER = `// This file was overwritten by prisma-json-types-generator
// Report any issues to https://github.com/arthurfiorette/prisma-json-types-generator`;

/** Header to prepend to generated pjtg.ts */
export const LIB_HEADER = MODIFIED_HEADER.replace('overwritten', 'generated');
