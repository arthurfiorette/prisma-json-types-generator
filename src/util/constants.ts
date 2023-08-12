import path from 'path';

/** Name of the namespace in the type declaration */
export const PRISMA_NAMESPACE_NAME = 'Prisma';

/** The path to the namespace.d.ts file, used as a template for the prisma's index.d.ts */
export const NAMESPACE_PATH = path.resolve(__dirname, '../../assets/namespace.d.ts');
