import { expectAssignable, expectNotAssignable, expectNotType, expectType } from 'tsd';
import type { Model } from '../target/string/client';
import type { ModelUpdateInput } from '../target/string/models/Model';

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

// Test UpdateInput types with Prisma. prefix (Prisma 7 format)
// https://github.com/arthurfiorette/prisma-json-types-generator/issues/602
expectAssignable<ModelUpdateInput>({
  typed: 'C' as PStringJson.WithType
});

expectAssignable<ModelUpdateInput>({
  typed: { set: 'D' as PStringJson.WithType }
});

expectAssignable<ModelUpdateInput>({
  literal: 'A' as 'A' | 'B'
});

expectAssignable<ModelUpdateInput>({
  literal: { set: 'B' as 'A' | 'B' }
});

expectNotAssignable<ModelUpdateInput>({
  typed: 'invalid' as string
});

expectNotAssignable<ModelUpdateInput>({
  typed: { set: 'invalid' as string }
});

expectNotAssignable<ModelUpdateInput>({
  literal: 'invalid' as string
});

expectNotAssignable<ModelUpdateInput>({
  literal: { set: 'invalid' as string }
});
