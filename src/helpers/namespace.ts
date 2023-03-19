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

export type TypedNestedStringWithAggregatesFilter<T> = Prisma.NestedStringWithAggregatesFilter & {
  equals?: T;
  in?: Prisma.Enumerable<T>;
  notIn?: Prisma.Enumerable<T>;
  not: TypedNestedStringWithAggregatesFilter<T> | T
}

export type TypedStringWithAggregatesFilter<T> = Prisma.StringWithAggregatesFilter & {
  equals?: T;
  in?: Prisma.Enumerable<T>;
  notIn?: Prisma.Enumerable<T>;
  not?: TypedNestedStringWithAggregatesFilter<T> | T
}
`.trim();
}
