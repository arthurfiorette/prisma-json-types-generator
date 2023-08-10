import type { DMMF } from '@prisma/generator-helper';
import { JSON_REGEX, createRegexForType } from './regex';

/** A Prisma DMMF model with the regexes for each field. */
export interface ModelWithRegex extends DMMF.Model {
  regexps: RegExp[];
}

/**
 * Parses the DMMF document and returns a list of models that have at least one field with
 * typed json and the regexes for each field type.
 */
export function parseDmmf(dmmf: DMMF.Document): ModelWithRegex[] {
  return (
    dmmf.datamodel.models
      // All models that have at least one field with typed json
      .filter((m) => m.fields.some((f) => f.documentation?.match(JSON_REGEX)))
      // Define the regexes for each model
      .map(
        (model): ModelWithRegex => ({
          ...model,
          regexps: createRegexForType(model.name)
        })
      )
  );
}
