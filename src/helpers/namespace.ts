export function createNamespace(nsName: string) {
  return `

declare global {
  namespace ${nsName} {}
}

/**
 * A filter to be used against nullable List types.
 */
export type NullableListFilter<T> = {
  equals?: T | T[] | null;
  has?: T | null;
  hasEvery?: T | T[];
  hasSome?: T | T[];
  isEmpty?: boolean;
};

/**
 * A type to determine how to update a json field
 */
export type UpdateInput<T> = T extends object
  ? {
      [P in keyof T]?: UpdateInput<T[P]>;
    }
  : T;

/**
 * A type to determine how to update a json[] field
 */
export type UpdateManyInput<T> =
  | T
  | T[]
  | {
      set?: T | T[];
      push?: T | T[];
    };

/**
 * A type to determine how to create a json[] input
 */
export type CreateManyInput<T> =
  | T
  | T[]
  | {
      set?: T | T[];
    };

/**
 * A typed version of NestedStringFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedNestedStringFilter<T extends string> = Prisma.StringFilter & {
  equals?: T;
  in?: Prisma.Enumerable<T>;
  notIn?: Prisma.Enumerable<T>;
  not: TypedNestedStringFilter<T> | T
}

/**
 * A typed version of StringFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringFilter<T extends string> = Prisma.StringFilter & {
  equals?: T;
  in?: Prisma.Enumerable<T>;
  notIn?: Prisma.Enumerable<T>;
  not: TypedNestedStringFilter<T> | T
}

/**
 * A typed version of NestedStringNullableFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedNestedStringNullableFilter<T extends string> = Prisma.StringNullableFilter & {
  equals?: T | null;
  in?: Prisma.Enumerable<T> | null;
  notIn?: Prisma.Enumerable<T> | null;
  not: TypedNestedStringNullableFilter<T> | T | null
}

/**
 * A typed version of StringNullableFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringNullableFilter<T extends string> = Prisma.StringNullableFilter & {
  equals?: T | null;
  in?: Prisma.Enumerable<T> | null;
  notIn?: Prisma.Enumerable<T> | null;
  not: TypedNestedStringNullableFilter<T> | T | null
}

/**
 * A typed version of NestedStringWithAggregatesFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedNestedStringWithAggregatesFilter<T extends string> = Prisma.NestedStringWithAggregatesFilter & {
  equals?: T;
  in?: Prisma.Enumerable<T>;
  notIn?: Prisma.Enumerable<T>;
  not: TypedNestedStringWithAggregatesFilter<T> | T
}

/**
 * A typed version of StringWithAggregatesFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringWithAggregatesFilter<T extends string> = Prisma.StringWithAggregatesFilter & {
  equals?: T;
  in?: Prisma.Enumerable<T>;
  notIn?: Prisma.Enumerable<T>;
  not?: TypedNestedStringWithAggregatesFilter<T> | T
}

/**
 * A typed version of NestedStringNullableWithAggregatesFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedNestedStringNullableWithAggregatesFilter<T extends string> = Prisma.NestedStringNullableWithAggregatesFilter & {
  equals?: T | null;
  in?: Prisma.Enumerable<T> | null;
  notIn?: Prisma.Enumerable<T> | null;
  not: TypedNestedStringNullableWithAggregatesFilter<T> | T | null
}

/**
 * A typed version of tringNullableWithAggregatesFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringNullableWithAggregatesFilter<T extends string> = Prisma.StringNullableWithAggregatesFilter & {
  equals?: T | null;
  in?: Prisma.Enumerable<T> | null;
  notIn?: Prisma.Enumerable<T> | null;
  not?: TypedNestedStringNullableWithAggregatesFilter<T> | T | null
}

/**
 * A typed version of StringFieldUpdateOperationsInput, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringFieldUpdateOperationsInput<T extends string> = Prisma.StringFieldUpdateOperationsInput & {
  set?: T
}

/**
 * A typed version of NullableStringFieldUpdateOperationsInput, allowing narrowing of string types to discriminated unions.
 */
export type TypedNullableStringFieldUpdateOperationsInput<T extends string> = Prisma.NullableStringFieldUpdateOperationsInput & {
  set?: T | null
}

/**
 * A typed version of StringNullableListFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringNullableListFilter<T extends string> = Prisma.StringNullableListFilter & {
  equals?: Enumerable<T> | null
  has?: T | null
  hasEvery?: Enumerable<T>
  hasSome?: Enumerable<T>
}

/**
 * A typed version of the input type to update a string[] field, allowing narrowing of string types to discriminated unions.
 */
export type UpdateStringArrayInput<T extends string> = {
  set?: Enumerable<T>
  push?: T | Enumerable<T>
}

/**
 * A typed version of the input type to create a string[] field, allowing narrowing of string types to discriminated unions.
 */
export type CreateStringArrayInput<T extends string> = {
  set?: Enumerable<T>
}

`.trim();
}
