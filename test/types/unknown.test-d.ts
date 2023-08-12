import { expectNotType, expectType } from 'tsd';
import { Model } from '../target/unknown/index';

expectType<Model>({
  id: 0,
  field: {} as unknown
});

expectNotType<Model>({
  id: 0,
  field: {} as any
});
