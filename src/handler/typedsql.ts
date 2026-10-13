import fs from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type DMMF from '@prisma/dmmf';
import type { GeneratorOptions, SqlQueryOutput } from '@prisma/generator';
import ts from 'typescript';
import { type DescribedColumn, describeQueryOrigins } from '../helpers/pg-origins';
import { parseSqlAnnotations } from '../helpers/sql-annotations';
import type { PrismaJsonTypesGeneratorConfig } from '../util/config';
import { createType } from '../util/create-signature';
import { findFirstCodeIndex } from '../util/source-path';
import { applyTextChanges, type TextDiff } from '../util/text-changes';

/** The types to replace in a single TypedSQL query. */
export interface QueryTypes {
  /** Result column name to its new type */
  columns: Map<string, string>;
  /** Parameter index to its new type */
  parameters: Map<number, string>;
}

/**
 * Resolves the new type of every result column and parameter of every TypedSQL query.
 *
 * A result column is typed by, in order of precedence:
 *
 * 1. A `-- [Type] column` annotation in the leading comment block of its `.sql` file.
 * 2. The annotation of the schema field it was read from, as reported by the database
 *    itself (postgres only). Columns are never matched by name, so same-named columns of
 *    different tables cannot be confused and aliases, joins and CTEs just work.
 *
 * Anything else, like computed expressions, keeps the type prisma generated.
 *
 * Parameters are typed by an annotation in the description of their prisma `@param` tag,
 * since a parameter does not come from any field.
 */
export async function resolveTypedSqlTypes(
  options: GeneratorOptions,
  config: PrismaJsonTypesGeneratorConfig,
  warn: (message: string) => void
) {
  const queries = options.typedSql ?? [];
  const result = new Map<string, QueryTypes>();

  if (!queries.length) {
    return result;
  }

  // Multi-file schemas pass their directory
  const schemaDir = (await fs.stat(options.schemaPath).catch(() => null))?.isDirectory()
    ? options.schemaPath
    : dirname(options.schemaPath);

  // Prisma reads queries from `typedSql.path` of prisma.config.ts, defaulting to `sql/` next
  // to the schema. The config is not visible to generators, hence the `typedSqlPath` option.
  const sqlDir = config.typedSqlPath
    ? resolve(schemaDir, config.typedSqlPath)
    : join(schemaDir, 'sql');

  const described = await describeOrigins(options, config, schemaDir, queries, warn);

  // Both fold unquoted identifiers to lowercase, so `AS Stats` returns a `stats` column
  const provider = options.datasources[0]?.activeProvider;
  const foldUnquoted = provider === 'postgresql' || provider === 'cockroachdb';

  if (!(await fs.stat(sqlDir).catch(() => null))?.isDirectory()) {
    warn(
      `Could not find ${sqlDir} to read column annotations from. Set the \`typedSqlPath\` generator option if your queries live elsewhere.`
    );
  }

  for (const query of queries) {
    const types: QueryTypes = { columns: new Map(), parameters: new Map() };
    result.set(query.name, types);

    const columns = described?.columns.get(query.name);

    for (const [index, column] of query.resultColumns.entries()) {
      // Postgres describes the same statement prisma did, so they must line up exactly
      const origin = columns?.[index]?.name === column.name ? columns[index]!.origin : undefined;
      const field = origin && described?.fields.get(fieldKey(origin));

      if (!field) {
        continue;
      }

      const type = createType(field.documentation, config);

      // Mirrors model payloads: unannotated Json becomes unknown, other types are kept
      if (type !== 'unknown' || (field.type === 'Json' && !config.allowAny)) {
        types.columns.set(column.name, type);
      }
    }

    for (const [column, annotation] of await readSqlAnnotations(sqlDir, query, foldUnquoted)) {
      if (!query.resultColumns.some((c) => c.name === column)) {
        warn(`${query.name}.sql annotates column "${column}", which the query does not return.`);
        continue;
      }

      types.columns.set(column, createType(annotation, config));
    }

    for (const [index, parameter] of query.parameters.entries()) {
      const type = createType(parameter.documentation ?? undefined, config);

      // Descriptions are free text, only an actual annotation should change anything
      if (type !== 'unknown') {
        types.parameters.set(index, type);
      }
    }
  }

  return result;
}

/** Maps every scalar field of the schema by the database column it is stored in. */
function buildFieldMap(dmmf: DMMF.Document, defaultSchema: string) {
  const fields = new Map<string, DMMF.Field>();

  for (const model of dmmf.datamodel.models) {
    for (const field of model.fields) {
      if (field.kind !== 'scalar' && field.kind !== 'enum') {
        continue;
      }

      fields.set(
        fieldKey({
          schema: model.schema ?? defaultSchema,
          table: model.dbName ?? model.name,
          column: field.dbName ?? field.name
        }),
        field
      );
    }
  }

  return fields;
}

function fieldKey(origin: { schema: string; table: string; column: string }) {
  return JSON.stringify([origin.schema, origin.table, origin.column]);
}

async function describeOrigins(
  options: GeneratorOptions,
  config: PrismaJsonTypesGeneratorConfig,
  schemaDir: string,
  queries: readonly SqlQueryOutput[],
  warn: (message: string) => void
) {
  if (options.datasources[0]?.activeProvider !== 'postgresql') {
    return undefined;
  }

  const url = process.env[config.typedSqlUrlEnv];

  if (!url) {
    warn(
      `TypedSQL columns were not matched to schema fields because the \`${config.typedSqlUrlEnv}\` environment variable is not set. ` +
        'Set the `typedSqlUrlEnv` generator option to the variable holding your database url.'
    );
    return undefined;
  }

  try {
    const { defaultSchema, queries: described } = await describeQueryOrigins(
      url,
      schemaDir,
      queries
    );
    const columns = new Map<string, DescribedColumn[]>();

    for (const [name, result] of described) {
      if (result instanceof Error) {
        warn(`Could not describe ${name}.sql: ${result.message}`);
        continue;
      }

      columns.set(name, result);
    }

    return { columns, fields: buildFieldMap(options.dmmf, defaultSchema) };
  } catch (error) {
    warn(
      `TypedSQL columns were not matched to schema fields: ${error instanceof Error ? error.message : String(error)}`
    );
    return undefined;
  }
}

async function readSqlAnnotations(sqlDir: string, query: SqlQueryOutput, foldUnquoted: boolean) {
  const content = await fs.readFile(join(sqlDir, `${query.name}.sql`), 'utf-8').catch(() => null);

  return content === null ? new Map<string, string>() : parseSqlAnnotations(content, foldUnquoted);
}

/**
 * Rewrites a generated TypedSQL file, replacing only the node that stands for each
 * column's or parameter's own type, so everything prisma wrapped around it (`| null` for
 * nullable columns, `[]` for array columns) is kept as is.
 *
 * Handles both clients: `prisma-client` (`as (...) => TypedSql` cast in a `.ts` file) and
 * `prisma-client-js` (`const q: (...) => TypedSql` in a `.d.ts` file).
 */
export function rewriteTypedSqlFile(content: string, queryName: string, types: QueryTypes) {
  const source = ts.createSourceFile('query.ts', content, ts.ScriptTarget.ESNext, true);
  const changes: TextDiff[] = [];

  const replace = (node: ts.TypeNode | undefined, type: string | undefined) => {
    const base = node && type ? findBaseType(node) : undefined;

    if (base && type) {
      changes.push({ start: base.getStart(source), end: base.end, text: type });
    }
  };

  const replaceParameters = (parameters: readonly (ts.TypeNode | undefined)[]) => {
    for (const [index, node] of parameters.entries()) {
      replace(node, types.parameters.get(index));
    }
  };

  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.name.text !== queryName) {
          continue;
        }

        const signature =
          declaration.type ??
          (declaration.initializer && ts.isAsExpression(declaration.initializer)
            ? declaration.initializer.type
            : undefined);

        if (signature && ts.isFunctionTypeNode(signature)) {
          replaceParameters(signature.parameters.map((p) => p.type));
        }
      }

      continue;
    }

    if (
      !ts.isModuleDeclaration(statement) ||
      statement.name.text !== queryName ||
      !statement.body ||
      !ts.isModuleBlock(statement.body)
    ) {
      continue;
    }

    for (const alias of statement.body.statements) {
      if (!ts.isTypeAliasDeclaration(alias)) {
        continue;
      }

      if (alias.name.text === 'Result' && ts.isTypeLiteralNode(alias.type)) {
        for (const member of alias.type.members) {
          if (ts.isPropertySignature(member) && member.name) {
            replace(member.type, types.columns.get(getPropertyName(member.name)));
          }
        }
      }

      if (alias.name.text === 'Parameters' && ts.isTupleTypeNode(alias.type)) {
        replaceParameters(
          alias.type.elements.map((element) =>
            ts.isNamedTupleMember(element) ? element.type : element
          )
        );
      }
    }
  }

  return { content: applyTextChanges(content, changes), changed: changes.length > 0 };
}

/** Unwraps `X | null`, `X[]` and `(X)` down to `X`, or undefined for anything else. */
function findBaseType(node: ts.TypeNode): ts.TypeNode | undefined {
  if (ts.isParenthesizedTypeNode(node)) {
    return findBaseType(node.type);
  }

  if (ts.isArrayTypeNode(node)) {
    return findBaseType(node.elementType);
  }

  if (ts.isUnionTypeNode(node)) {
    const types = node.types.filter(
      (type) => !ts.isLiteralTypeNode(type) || type.literal.kind !== ts.SyntaxKind.NullKeyword
    );

    return types.length === 1 ? findBaseType(types[0]!) : undefined;
  }

  return node;
}

function getPropertyName(name: ts.PropertyName) {
  // Prisma writes names that aren't identifiers as `["computed"]` properties
  if (ts.isComputedPropertyName(name) && ts.isStringLiteralLike(name.expression)) {
    return name.expression.text;
  }

  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : name.getText();
}

/** Applies the resolved types to every query file generated for a client. */
export async function handleTypedSqlFiles(
  outputDir: string,
  isNewClient: boolean,
  /** `generatedFileExtension` of the client generator, `.d.ts` files for prisma-client-js */
  fileExtension: string,
  importFileExtension: string | undefined,
  types: Map<string, QueryTypes>,
  warn: (message: string) => void
) {
  for (const [queryName, queryTypes] of types) {
    if (!queryTypes.columns.size && !queryTypes.parameters.size) {
      continue;
    }

    const filepath = join(outputDir, 'sql', `${queryName}.${fileExtension}`);
    const original = await fs.readFile(filepath, 'utf-8').catch(() => null);

    if (original === null) {
      warn(`Could not find ${filepath} to type the ${queryName} query.`);
      continue;
    }

    let { content, changed } = rewriteTypedSqlFile(original, queryName, queryTypes);

    if (!changed) {
      continue;
    }

    // Same as model files, makes sure the global namespace is part of the program
    if (isNewClient && (await fs.stat(join(outputDir, 'pjtg.ts')).catch(() => null))) {
      const index = findFirstCodeIndex(content);
      const dotExt = importFileExtension ? `.${importFileExtension}` : '';
      content = `${content.slice(0, index)}\nimport type * as PJTG from '../pjtg${dotExt}';\n${content.slice(index)}`;
    }

    await fs.writeFile(filepath, content);
  }
}
