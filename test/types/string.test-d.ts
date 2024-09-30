import { expectNotType, expectType } from 'tsd';
import type { Model } from '../target/string/index';

declare global {
  export namespace PStringJson {
    type WithType = 'C' | 'D';
  }
}

expectType<Model>({
  id: 0,
  untyped: '' as string,
  typed: 'C' as PStringJson.WithType,
  literal: 'A' as 'A' | 'B'
});

expectNotType<Model>({
  id: 0,
  untyped: 'Mesquita' as string,
  typed: 'D' as string,
  literal: 'D' as string
});
