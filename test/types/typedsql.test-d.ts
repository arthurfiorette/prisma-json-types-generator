import { expectAssignable, expectNotAssignable } from 'tsd';
import type { Model, Prisma } from '../target/typedSql/client';

declare global {
  export namespace PTypedSqlJson {
    export type OptionalField = string;
  }
}

// field is typed as (number) from the /// ![number] annotation
expectAssignable<Model>({
  id: 0,
  field: 42,
  optField: null
});

// optField is PTypedSqlJson.OptionalField | null (string | null here)
expectAssignable<Model>({
  id: 0,
  field: 0,
  optField: 'hello'
});

// field should NOT accept a string (it's (number))
expectNotAssignable<Model>({
  id: 0,
  field: 'not-a-number',
  optField: null
});

// optField should NOT accept a number (it's OptionalField = string)
expectNotAssignable<Model>({
  id: 0,
  field: 0,
  optField: 42
});

// CreateInput should reflect the same type constraints
expectAssignable<Prisma.ModelCreateInput>({
  id: 1,
  field: 1,
  optField: 'value'
});

expectNotAssignable<Prisma.ModelCreateInput>({
  id: 1,
  field: 'not-a-number'
});
