import type { DMMF } from '@prisma/generator-helper';
import { JSON_REGEX, regexForPrismaType } from './regex';

export type ModelWithRegex = DMMF.Model & {
  regexps: RegExp[];
};

export function parseDmmf(dmmf: DMMF.Document): ModelWithRegex[] {
  return (
    dmmf.datamodel.models
      // All models that have at least one field with typed json
      .filter((m) => m.fields.some((f) => f.documentation?.match(JSON_REGEX)))
      .map((m) => ({
        ...m,
        // Loads all names and subnames regexes for the model
        regexps: regexForPrismaType(m.name)
      }))
  );
}
