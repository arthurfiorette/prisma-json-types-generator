import type { GeneratorConfig } from '@prisma/generator-helper';
import { PrismaJsonTypesGeneratorError } from './error';

/**
 * Finds the `prisma-client-generator` configuration from a list of generators or throws
 * an error.
 */
export function findPrismaClientGenerator(generators: GeneratorConfig[]) {
  const options = generators.find((g) => g.provider.value === 'prisma-client-js');

  if (!options) {
    throw new PrismaJsonTypesGeneratorError(
      'Could not find client generator options, are you using `prisma-client-js` before `prisma-json-types-generator`?'
    );
  }

  if (!options.output?.value) {
    throw new PrismaJsonTypesGeneratorError('`prisma-client-js` output not found', options);
  }

  return options as GeneratorConfig & { output: { value: string } };
}
