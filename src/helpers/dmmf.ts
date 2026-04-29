import type DMMF from '@prisma/dmmf';
import { createRegexForType, generateTypeNamesFromName } from './regex';
import { parseTypeSyntax } from './type-parser';

/** A Prisma DMMF model/type with the regexes for each field. */
export interface PrismaEntity extends DMMF.Model {
  regexps: RegExp[];
  type: 'model' | 'type';
}

const isTransformable = (field: DMMF.Field) => {
  if (field.type === 'Json') {
    return true;
  }
  return parseTypeSyntax(field.documentation);
};

/**
 * Parses the DMMF document and returns a list of models that have at least one field with
 * typed json and the regexes for each field type.
 */
export function extractPrismaModels(dmmf: DMMF.Document): {
  typeToNameMap: Map<string, string>;
  modelMap: Map<string, PrismaEntity>;
  knownNoOps: Set<string>;
} {
  const models = dmmf.datamodel.models
    // Define the regexes for each model
    .map(
      (model): PrismaEntity => ({
        ...model,
        type: 'model',
        regexps: createRegexForType(model.name)
      })
    );
  const types = dmmf.datamodel.types.map(
    (model): PrismaEntity => ({
      ...model,
      type: 'type',
      regexps: createRegexForType(model.name)
    })
  );
  const allModels = [];

  const knownNoOps = new Set<string>();
  for (const m of models.concat(types)) {
    if (m.fields.some((f) => isTransformable(f))) {
      allModels.push(m);
    } else {
      knownNoOps.add(m.name);
    }
  }
  const typeToNameMap = new Map<string, string>();
  for (const m of allModels) {
    const operations = generateTypeNamesFromName(m.name);
    for (const o of operations) {
      typeToNameMap.set(o, m.name);
    }
  }
  const modelMap = new Map<string, PrismaEntity>();
  for (const m of allModels) {
    modelMap.set(m.name, m);
  }
  return { typeToNameMap, modelMap, knownNoOps };
}
