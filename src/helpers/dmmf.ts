import type DMMF from '@prisma/dmmf';
import { createRegexForType } from './regex';

/** A Prisma DMMF model/type with the regexes for each field. */
export interface PrismaEntity extends DMMF.Model {
  regexps: RegExp[];
  type: 'model' | 'type';
}

/**
 * Parses the DMMF document and returns a list of models that have at least one field with
 * typed json and the regexes for each field type.
 */
export function extractPrismaModels(dmmf: DMMF.Document): PrismaEntity[] {
  const models = dmmf.datamodel.models
    // Define the regexes for each model
    .map(
      (model): PrismaEntity => ({
        ...model,
        type: 'model',
        regexps: createRegexForType(model.name)
      })
    );
  const types = dmmf.datamodel.types
    // Define the regexes for each model
    .map(
      (model): PrismaEntity => ({
        ...model,
        type: 'type',
        regexps: createRegexForType(model.name)
      })
    );
  return models.concat(types);
}
