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
export type TypedNestedStringFilter<S extends string> = Prisma.StringFilter & {
  equals?: S;
  in?: Prisma.Enumerable<S>;
  notIn?: Prisma.Enumerable<S>;
  not: TypedNestedStringFilter<S> | S
}

/**
 * A typed version of StringFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringFilter<S extends string> = Prisma.StringFilter & {
  equals?: S;
  in?: Prisma.Enumerable<S>;
  notIn?: Prisma.Enumerable<S>;
  not: TypedNestedStringFilter<S> | S
}

/**
 * A typed version of NestedStringNullableFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedNestedStringNullableFilter<S extends string> = Prisma.StringNullableFilter & {
  equals?: S | null;
  in?: Prisma.Enumerable<S> | null;
  notIn?: Prisma.Enumerable<S> | null;
  not: TypedNestedStringNullableFilter<S> | S | null
}

/**
 * A typed version of StringNullableFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringNullableFilter<S extends string> = Prisma.StringNullableFilter & {
  equals?: S | null;
  in?: Prisma.Enumerable<S> | null;
  notIn?: Prisma.Enumerable<S> | null;
  not: TypedNestedStringNullableFilter<T> | S | null
}

/**
 * A typed version of NestedStringWithAggregatesFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedNestedStringWithAggregatesFilter<S extends string> = Prisma.NestedStringWithAggregatesFilter & {
  equals?: S;
  in?: Prisma.Enumerable<S>;
  notIn?: Prisma.Enumerable<S>;
  not: TypedNestedStringWithAggregatesFilter<S> | S
}

/**
 * A typed version of StringWithAggregatesFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringWithAggregatesFilter<S extends string> = Prisma.StringWithAggregatesFilter & {
  equals?: S;
  in?: Prisma.Enumerable<S>;
  notIn?: Prisma.Enumerable<S>;
  not?: TypedNestedStringWithAggregatesFilter<S> | S
}

/**
 * A typed version of NestedStringNullableWithAggregatesFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedNestedStringNullableWithAggregatesFilter<S extends string> = Prisma.NestedStringNullableWithAggregatesFilter & {
  equals?: S | null;
  in?: Prisma.Enumerable<S> | null;
  notIn?: Prisma.Enumerable<S> | null;
  not: TypedNestedStringNullableWithAggregatesFilter<S> | S | null
}

/**
 * A typed version of tringNullableWithAggregatesFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringNullableWithAggregatesFilter<S extends string> = Prisma.StringNullableWithAggregatesFilter & {
  equals?: S | null;
  in?: Prisma.Enumerable<S> | null;
  notIn?: Prisma.Enumerable<S> | null;
  not?: TypedNestedStringNullableWithAggregatesFilter<T> | S | null
}

/**
 * A typed version of StringFieldUpdateOperationsInput, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringFieldUpdateOperationsInput<S extends string> = Prisma.StringFieldUpdateOperationsInput & {
  set?: S
}

/**
 * A typed version of NullableStringFieldUpdateOperationsInput, allowing narrowing of string types to discriminated unions.
 */
export type TypedNullableStringFieldUpdateOperationsInput<S extends string> = Prisma.NullableStringFieldUpdateOperationsInput & {
  set?: S | null
}

/**
 * A typed version of StringNullableListFilter, allowing narrowing of string types to discriminated unions.
 */
export type TypedStringNullableListFilter<S extends string> = Prisma.StringNullableListFilter & {
  equals?: Enumerable<S> | null
  has?: S | null
  hasEvery?: Enumerable<S>
  hasSome?: Enumerable<S>
}

/**
 * A typed version of the input type to update a string[] field, allowing narrowing of string types to discriminated unions.
 */
export type UpdateStringArrayInput<S extends string> = {
  set?: Enumerable<S>
  push?: S | Enumerable<S>
}

/**
 * A typed version of the input type to create a string[] field, allowing narrowing of string types to discriminated unions.
 */
export type CreateStringArrayInput<S extends string> = {
  set?: Enumerable<S>
}

`.trim();
}
