import { expectNotType, expectType } from 'tsd';
import { Text } from '../target/mssql/index';

declare global {
  export namespace PMssqlJson {
    type WithType = 'C' | 'D';
  }
}

expectType<Text>({
  id: 0,
  untyped: '' as string,
  typed: 'C' as PMssqlJson.WithType,
  literal: 'A' as 'A' | 'B'
});

expectNotType<Text>({
  id: 0,
  untyped: 'Arthur' as string,
  typed: 'D' as string,
  literal: 'D' as string
});
