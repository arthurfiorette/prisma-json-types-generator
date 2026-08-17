import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import type { findByFilter } from '../target/typedSql-pg/sql/findByFilter';
import type { getModel } from '../target/typedSql-pg/sql/getModel';

declare global {
  export namespace PTypedSqlJson {
    export type OptionalField = string;
    export type UserIdString = string & { __brand: 'UserId' };
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

// A `@map`ed column is reported by whichever name the query gives it, so both have to
// resolve: the db name when it is selected bare...
expectType<{ unit: string }>(result.mapped_column);

// ...and the prisma field name when it is aliased, which is how a snake_case schema is
// normally queried. Keying on the db name alone leaves every such column `unknown`.
expectType<{ unit: string }>(result.mapped);

// Nothing about the replacement is specific to Json: an annotated `String` column carries
// its annotated type into the result, exactly as it does into the model payload
expectType<PTypedSqlJson.UserIdString>(result.userId);

// `slug` is annotated differently by Model and Other. Unlike an ambiguous Json column,
// which has only `JsonValue` to fall back on, prisma already wrote a real type here -- so
// it is kept. Degrading it to `unknown` would be strictly worse than doing nothing.
expectType<string>(result.slug);

// A column no model annotates is likewise left exactly as prisma wrote it
expectType<string>(result.plain);

// The whole row still type checks as a unit
declare const userId: PTypedSqlJson.UserIdString;

expectAssignable<getModel.Result>({
  id: 1,
  field_alias: 42,
  optField: null,
  tags: [{ tag: 'a' }],
  shared: 'anything',
  mapped_column: { unit: 'a' },
  mapped: { unit: 'a' },
  userId,
  slug: 'anything',
  plain: 'anything'
});

// The brand is real: a plain string is not assignable to the annotated column
expectNotAssignable<getModel.Result>({
  id: 1,
  field_alias: 42,
  optField: null,
  tags: [{ tag: 'a' }],
  shared: 'anything',
  mapped_column: { unit: 'a' },
  mapped: { unit: 'a' },
  userId: 'unbranded',
  slug: 'anything',
  plain: 'anything'
});

expectNotAssignable<getModel.Result>({
  id: 1,
  field_alias: 'not-a-number',
  optField: null,
  tags: [{ tag: 'a' }],
  shared: 'anything',
  mapped_column: { unit: 'a' },
  mapped: { unit: 'a' },
  userId,
  slug: 'anything',
  plain: 'anything'
});

expectNotAssignable<getModel.Result>({
  id: 1,
  field_alias: 1,
  optField: 42,
  tags: [{ tag: 'a' }],
  shared: 'anything',
  mapped_column: { unit: 'a' },
  mapped: { unit: 'a' },
  userId,
  slug: 'anything',
  plain: 'anything'
});

expectNotAssignable<getModel.Result>({
  id: 1,
  field_alias: 1,
  optField: null,
  tags: [{ tag: 'a' }],
  shared: 'anything',
  mapped_column: { unit: 42 },
  mapped: { unit: 'a' },
  userId,
  slug: 'anything',
  plain: 'anything'
});

// Annotated `-- @param` is replaced in the namespace tuple...
expectAssignable<findByFilter.Parameters[0]>({ tag: 'a' });
expectNotAssignable<findByFilter.Parameters[0]>({ tag: 42 });

// ...and in the exported factory's own signature
expectAssignable<Parameters<typeof findByFilter>[0]>({ tag: 'a' });
expectNotAssignable<Parameters<typeof findByFilter>[0]>({ tag: 42 });

// An unannotated Json parameter keeps prisma's input type, which still accepts objects
expectAssignable<findByFilter.Parameters[1]>({ anything: true });

// Parameters are annotated the same way whatever their kind...
expectAssignable<findByFilter.Parameters[2]>(userId);
expectNotAssignable<findByFilter.Parameters[2]>('unbranded');
expectAssignable<Parameters<typeof findByFilter>[2]>(userId);

// ...and an unannotated one of any kind keeps what prisma wrote
expectType<string>(({} as findByFilter.Parameters)[3]);
