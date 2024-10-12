import { expectNotType, expectType } from 'tsd';
import type { FirstModel, SecondModel } from '../target/multimodel/index';

declare global {
  export namespace PStringJson {
    type TypeOne = 'A' | 'B';
    type TypeTwo = 'C' | 'D';
  }
}

expectType<FirstModel>({
  id: 0,
  untyped: '' as string,
  typed1: 'A' as PStringJson.TypeOne,
  literal: 'A' as 'A' | 'B'
});

expectNotType<FirstModel>({
  id: 0,
  untyped: 'Mesquita' as string,
  typed: 'D' as string,
  literal: 'D' as string
});


expectType<SecondModel>({
  id: 0,
  untyped: '' as string,
  typed2: 'C' as PStringJson.TypeTwo,
  literal: 'C' as 'C' | 'D'
});

expectNotType<SecondModel>({
  id: 0,
  untyped: 'Mesquita' as string,
  typed: 'A' as string,
  literal: 'A' as string
});
