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

export type TypedNestedStringFilter<T extends string> = Prisma.StringFilter & {
  equals?: T;
  in?: Prisma.Enumerable<T>;
  notIn?: Prisma.Enumerable<T>;
  not: TypedNestedStringFilter<T> | T
}

export type TypedStringFilter<T extends string> = Prisma.StringFilter & {
  equals?: T;
  in?: Prisma.Enumerable<T>;
  notIn?: Prisma.Enumerable<T>;
  not: TypedNestedStringFilter<T> | T
}

export type TypedNestedStringNullableFilter<T extends string> = Prisma.StringNullableFilter & {
  equals?: T | null;
  in?: Prisma.Enumerable<T> | null;
  notIn?: Prisma.Enumerable<T> | null;
  not: TypedNestedStringNullableFilter<T> | T | null
}

export type TypedStringNullableFilter<T extends string> = Prisma.StringNullableFilter & {
  equals?: T | null;
  in?: Prisma.Enumerable<T> | null;
  notIn?: Prisma.Enumerable<T> | null;
  not: TypedNestedStringNullableFilter<T> | T | null
}

export type TypedNestedStringWithAggregatesFilter<T extends string> = Prisma.NestedStringWithAggregatesFilter & {
  equals?: T;
  in?: Prisma.Enumerable<T>;
  notIn?: Prisma.Enumerable<T>;
  not: TypedNestedStringWithAggregatesFilter<T> | T
}

export type TypedStringWithAggregatesFilter<T extends string> = Prisma.StringWithAggregatesFilter & {
  equals?: T;
  in?: Prisma.Enumerable<T>;
  notIn?: Prisma.Enumerable<T>;
  not?: TypedNestedStringWithAggregatesFilter<T> | T
}

export type TypedNestedStringNullableWithAggregatesFilter<T extends string> = Prisma.NestedStringNullableWithAggregatesFilter & {
  equals?: T | null;
  in?: Prisma.Enumerable<T> | null;
  notIn?: Prisma.Enumerable<T> | null;
  not: TypedNestedStringNullableWithAggregatesFilter<T> | T | null
}

export type TypedStringNullableWithAggregatesFilter<T extends string> = Prisma.StringNullableWithAggregatesFilter & {
  equals?: T | null;
  in?: Prisma.Enumerable<T> | null;
  notIn?: Prisma.Enumerable<T> | null;
  not?: TypedNestedStringNullableWithAggregatesFilter<T> | T | null
}

export type TypedStringFieldUpdateOperationsInput<T extends string> = Prisma.StringFieldUpdateOperationsInput & {
  set?: T
}

export type TypedNullableStringFieldUpdateOperationsInput<T extends string> = Prisma.NullableStringFieldUpdateOperationsInput & {
  set?: T | null
}

`.trim();
}
