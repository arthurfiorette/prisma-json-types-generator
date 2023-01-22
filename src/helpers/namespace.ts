export function createNamespace(nsName: string) {
  return `

declare global {
  namespace ${nsName} {}
}

/**
 * A filter to be used against nullable List types.
 */
export type NullableListFilter<T> = {
  equals?: Enumerable<T> | null;
  has?: T | null;
  hasEvery?: Enumerable<T>;
  hasSome?: Enumerable<T>;
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
  | Enumerable<T>
  | {
      set?: Enumerable<T>;
      push?: Enumerable<T>;
    };

/**
 * A type to determine how to create a json[] input
 */
export type CreateManyInput<T> =
  | Enumerable<T>
  | {
      set?: Enumerable<T>;
    };

`.trim();
}
