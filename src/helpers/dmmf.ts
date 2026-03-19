import type DMMF from '@prisma/dmmf';
import type { ColumnAnnotationMap } from '../handler/typedsql';
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

/**
 * Builds a map from database column names to their documentation for JSON fields.
 *
 * This is used when processing TypedSQL query result columns — each column name is
 * matched against the Prisma schema field (or its `@map`-ed database name) to find
 * the documentation annotation that drives type replacement.
 *
 * When the same column name exists in multiple models, the first model encountered wins.
 */
export function buildTypedSqlColumnAnnotationMap(dmmf: DMMF.Document): ColumnAnnotationMap {
  const map: ColumnAnnotationMap = new Map();

  for (const model of dmmf.datamodel.models) {
    for (const field of model.fields) {
      if (field.type !== 'Json') continue;

      // Use the @map column name if provided, otherwise the field name
      const columnName = field.dbName || field.name;

      // First model with this column name wins to avoid ambiguity
      if (!map.has(columnName)) {
        map.set(columnName, field.documentation);
      }
    }
  }

  return map;
}
