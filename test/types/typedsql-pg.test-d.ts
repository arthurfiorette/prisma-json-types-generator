import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import type { findByFilter } from '../target/typedSql-pg/sql/findByFilter';
import type { getModel } from '../target/typedSql-pg/sql/getModel';

declare global {
  export namespace PTypedSqlJson {
    export type OptionalField = string;
  }
}

declare const result: getModel.Result;

// Aliased column, typed by the `-- @pjt-type field_alias ![number]` annotation
expectType<number>(result.field_alias);

// Model based `[OptionalField]` annotation, keeping prisma's nullability
expectType<string | null>(result.optField);

// json-array column: the annotation types the element, and prisma's own `| null` for a
// column it cannot prove non-nullable is preserved
expectType<{ tag: string }[] | null>(result.tags);

// `shared` is annotated differently by Model and Other. Prisma does not say which table
// a result column came from, so it stays unknown rather than silently picking one
expectType<unknown>(result.shared);

// The whole row still type checks as a unit
expectAssignable<getModel.Result>({
  id: 1,
  field_alias: 42,
  optField: null,
  tags: [{ tag: 'a' }],
  shared: 'anything'
});

expectNotAssignable<getModel.Result>({
  id: 1,
  field_alias: 'not-a-number',
  optField: null,
  tags: [{ tag: 'a' }],
  shared: 'anything'
});

expectNotAssignable<getModel.Result>({
  id: 1,
  field_alias: 1,
  optField: 42,
  tags: [{ tag: 'a' }],
  shared: 'anything'
});

// Annotated `-- @param` is replaced in the namespace tuple...
expectAssignable<findByFilter.Parameters[0]>({ tag: 'a' });
expectNotAssignable<findByFilter.Parameters[0]>({ tag: 42 });

// ...and in the exported factory's own signature
expectAssignable<Parameters<typeof findByFilter>[0]>({ tag: 'a' });
expectNotAssignable<Parameters<typeof findByFilter>[0]>({ tag: 42 });

// An unannotated Json parameter keeps prisma's input type, which still accepts objects
expectAssignable<findByFilter.Parameters[1]>({ anything: true });
