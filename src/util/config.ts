export interface PrismaJsonTypesGeneratorConfig {
  /**
   * The namespace to generate the types in.
   *
   * @default 'PrismaJson'
   */
  namespace: string;

  /**
   * The name of the client output type. By default it will try to find it automatically
   *
   * (./ -> relative to schema, or an importable path to require() it)
   *
   * @default undefined
   */
  clientOutput?: string;

  /**
   * In case you need to use a type, export it inside the namespace and we will add a
   * index signature to it
   *
   * @example
   *
   * ```ts
   * export namespace PrismaJson {
   *   export type GlobalType = {
   *     fieldA: string;
   *     fieldB: MyType;
   *   };
   * }
   * ```
   *
   * @default undefined
   */
  useType?: string;

  /**
   * If we should allow untyped JSON fields to be any, otherwise we change them to
   * unknown.
   *
   * @default false
   */
  allowAny?: boolean;

  /**
   * The environment variable holding the postgres url used to match TypedSQL result
   * columns to the schema fields they are read from. Prisma does not pass the datasource
   * url to generators, so it has to be read from the environment.
   *
   * @default 'DATABASE_URL'
   */
  typedSqlUrlEnv: string;

  /**
   * The directory of your TypedSQL `.sql` files, relative to the schema. Only needed when
   * `typedSql.path` is customized in prisma.config.ts, since generators cannot read it.
   *
   * @default 'sql'
   */
  typedSqlPath?: string;
}

export function parseConfig(
  config: Record<string, string | string[] | undefined>
): PrismaJsonTypesGeneratorConfig {
  return {
    namespace: config.namespace ? String(config.namespace) : 'PrismaJson',

    // This gets overwritten in the generator
    clientOutput: config.clientOutput ? String(config.clientOutput) : undefined,

    useType: config.useType ? String(config.useType) : undefined,

    allowAny: config.allowAny ? String(config.allowAny).toLowerCase().trim() === 'true' : false,

    typedSqlUrlEnv: config.typedSqlUrlEnv ? String(config.typedSqlUrlEnv) : 'DATABASE_URL',

    typedSqlPath: config.typedSqlPath ? String(config.typedSqlPath) : undefined
  };
}
