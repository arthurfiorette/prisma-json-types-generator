import { expectNotType, expectType } from 'tsd';
import { Model, Prisma } from '../target/any/index';

expectType<Model>({
  id: 0,
  field: {} as Prisma.JsonValue
});

expectNotType<Model>({
  id: 0,
  field: {} as unknown
});
