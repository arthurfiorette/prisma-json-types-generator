import type { DMMF } from '@prisma/generator-helper';
import { createRegexForType } from './regex';

/** A Prisma DMMF model with the regexes for each field. */
export interface ModelWithRegex extends DMMF.Model {
  regexps: RegExp[];
}

/**
 * Parses the DMMF document and returns a list of models that have at least one field with
 * typed json and the regexes for each field type.
 */
export function extractPrismaModels(dmmf: DMMF.Document): ModelWithRegex[] {
  return (
    dmmf.datamodel.models
      // Define the regexes for each model
      .map(
        (model): ModelWithRegex => ({
          ...model,
          regexps: createRegexForType(model.name)
        })
      )
  );
}
