import type { GeneratorConfig } from '@prisma/generator-helper';
import { PrismaJsonTypesGeneratorError } from './error';

/**
 * Finds the `prisma-client-generator` configuration from a list of generators or throws
 * an error.
 */
export function findPrismaClientGenerator(generators: GeneratorConfig[]) {
  const options = generators.find((g) => ['prisma-client-js', 'prisma-client'].includes(g.provider.value as string));

  if (!options) {
    throw new PrismaJsonTypesGeneratorError(
      'Could not find client generator options, are you using `prisma-client-js` or `prisma-client` before `prisma-json-types-generator`?'
    );
  }

  if (!options.output?.value) {
    throw new PrismaJsonTypesGeneratorError('`prisma-client-js` or `prisma-client` output not found', options);
  }

  return options as GeneratorConfig & { output: { value: string } };
}
