import { expectAssignable, expectNotAssignable } from 'tsd';
import type { getModel } from '../target/typedSql-pg/sql/getModel';

declare global {
  export namespace PTypedSqlJson {
    export type OptionalField = string;
  }
}

// field is replaced with (number) from the /// ![number] annotation
expectAssignable<getModel.Result>({
  id: 1,
  field: 42,
  optField: null
});

// optField is replaced with PTypedSqlJson.OptionalField | null = string | null
expectAssignable<getModel.Result>({
  id: 1,
  field: 1,
  optField: 'hello'
});

// field should NOT accept a string (it's (number))
expectNotAssignable<getModel.Result>({
  id: 1,
  field: 'not-a-number',
  optField: null
});

// optField should NOT accept a number (it's string | null)
expectNotAssignable<getModel.Result>({
  id: 1,
  field: 1,
  optField: 42
});
