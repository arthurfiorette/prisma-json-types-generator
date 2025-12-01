import { expectAssignable, expectNotAssignable } from 'tsd';
import type { FakeModel } from '../target/stringarray/client';
import type {
  FakeModelCreateInput,
  FakeModelUpdateInput
} from '../target/stringarray/models/FakeModel';

declare global {
  export namespace PStringArrayJson {
    type MyFakeStringType = 'foo' | 'bar';
  }
}

// Test basic model type
expectAssignable<FakeModel>({
  id: '123e4567-e89b-12d3-a456-426614174000',
  fakeTags: ['foo', 'bar'] as PStringArrayJson.MyFakeStringType[]
});

expectNotAssignable<FakeModel>({
  id: '123e4567-e89b-12d3-a456-426614174000',
  fakeTags: ['invalid'] as string[]
});

// Test CreateInput types with Prisma. prefix (Prisma 7 format)
// https://github.com/arthurfiorette/prisma-json-types-generator/issues/603
expectAssignable<FakeModelCreateInput>({
  fakeTags: ['foo'] as PStringArrayJson.MyFakeStringType[]
});

expectAssignable<FakeModelCreateInput>({
  fakeTags: { set: ['bar'] as PStringArrayJson.MyFakeStringType[] }
});

expectNotAssignable<FakeModelCreateInput>({
  fakeTags: ['invalid'] as string[]
});

expectNotAssignable<FakeModelCreateInput>({
  fakeTags: { set: ['invalid'] as string[] }
});

// Test UpdateInput types with Prisma. prefix (Prisma 7 format)
expectAssignable<FakeModelUpdateInput>({
  fakeTags: ['foo', 'bar'] as PStringArrayJson.MyFakeStringType[]
});

expectAssignable<FakeModelUpdateInput>({
  fakeTags: { set: ['foo'] as PStringArrayJson.MyFakeStringType[] }
});

expectNotAssignable<FakeModelUpdateInput>({
  fakeTags: ['invalid'] as string[]
});

expectNotAssignable<FakeModelUpdateInput>({
  fakeTags: { set: ['invalid'] as string[] }
});
