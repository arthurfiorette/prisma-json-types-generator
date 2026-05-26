import { expectAssignable, expectNotAssignable } from 'tsd';
import type { getModel } from '../target/typedSql-pg/sql/getModel';

declare global {
  export namespace PTypedSqlJson {
    export type OptionalField = string;
  }
}

// field_alias is replaced with (number) via -- @pjt-type annotation in getModel.sql
expectAssignable<getModel.Result>({
  id: 1,
  field_alias: 42,
  optField: null
});

// optField is replaced with PTypedSqlJson.OptionalField | null = string | null
expectAssignable<getModel.Result>({
  id: 1,
  field_alias: 1,
  optField: 'hello'
});

// field_alias should NOT accept a string (it's (number))
expectNotAssignable<getModel.Result>({
  id: 1,
  field_alias: 'not-a-number',
  optField: null
});

// optField should NOT accept a number (it's string | null)
expectNotAssignable<getModel.Result>({
  id: 1,
  field_alias: 1,
  optField: 42
});
