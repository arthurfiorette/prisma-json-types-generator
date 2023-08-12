import { expectNotType, expectType } from 'tsd';
import { Model } from '../target/any/index';
import { Prisma } from '../target/unknown';

expectType<Model>({
  id: 0,
  field: {} as Prisma.JsonValue
});

expectNotType<Model>({
  id: 0,
  field: {} as unknown
});
