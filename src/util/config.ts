import { Dictionary } from '@prisma/generator-helper';

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
}

export function parseConfig(config: Dictionary<string>): PrismaJsonTypesGeneratorConfig {
  return {
    namespace: config.namespace ?? 'PrismaJson',
    // This gets overwritten in the generator
    clientOutput: config.clientOutput!,
    useType: config.useType,
    allowAny: config.allowAny ? config.allowAny.toLowerCase().trim() === 'true' : false
  };
}
