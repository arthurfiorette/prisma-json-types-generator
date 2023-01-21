export function createNamespace(nsName: string) {
  return `

declare global {
  namespace ${nsName} {}
}

// Helpers

type Update<T> = T extends object ? { [P in keyof T]?: Update<T[P]> } : T;

type NullableListFilter<T> = {
  equals?: Enumerable<T> | null;
  has?: T | null;
  hasEvery?: Enumerable<T>;
  hasSome?: Enumerable<T>;
  isEmpty?: boolean;
};

export type UpdateInput<T> = {
  set?: Enumerable<T>;
  push?: T | Enumerable<T>;
};

export type CreateInput<T> = {
  set?: Enumerable<T>;
};

`.trim();
}
