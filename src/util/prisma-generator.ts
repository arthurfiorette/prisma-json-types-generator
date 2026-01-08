import type { GeneratorConfig } from '@prisma/generator';
import { PrismaJsonTypesGeneratorError } from './error';

export type GeneratorWithOutput = GeneratorConfig & { output: { value: string } };

/**
 * Finds the `prisma-client-generator` configuration from a list of generators or throws
 * an error.
 */
export function findPrismaClientGenerators(generators: GeneratorConfig[]): GeneratorWithOutput[] {
  const options = generators.filter(
    (g) => g.provider.value === 'prisma-client-js' || g.provider.value === 'prisma-client'
  );

  if (!options.length) {
    throw new PrismaJsonTypesGeneratorError(
      'Could not find client generator options, are you using `prisma-client-js` or `prisma-client` before `prisma-json-types-generator`?'
    );
  }

  for (const option of options) {
    if (!option.output?.value) {
      throw new PrismaJsonTypesGeneratorError(
        '`prisma-client-js` or `prisma-client` output not found',
        options
      );
    }
  }

  return options as GeneratorWithOutput[];
}
