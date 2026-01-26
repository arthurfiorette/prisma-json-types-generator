import { Decimal } from '@prisma/client/runtime/client';
import { expectAssignable, expectNotAssignable } from 'tsd';
import type { ModelCreateInput, ModelWhereInput } from '../target/nullable/models';

declare global {
  export namespace PNullable {
    type TestJsonType = { foo: string; bar: number };
  }
}

// Test basic model type with all fields
expectAssignable<ModelCreateInput>({
  testInt: 42,
  testString: 'hello',
  testBoolean: true,
  testFloat: 3.14,
  testDateTime: new Date(),
  testDecimal: Decimal('123.45'),
  testBytes: new Uint8Array([1, 2, 3]),
  testBigInt: BigInt('9007199254740991'),
  testJSON: { foo: 'test', bar: 123 }
});

// Test model where inputs
expectAssignable<ModelWhereInput>({
  testInt: 42,
  testString: 'hello',
  testBoolean: true,
  testFloat: 3.14,
  testDateTime: new Date(),
  testDecimal: Decimal('123.45'),
  testBytes: new Uint8Array([1, 2, 3]),
  testBigInt: BigInt('9007199254740991')
});

// Expect that invalid types are not assignable
expectNotAssignable<ModelWhereInput>({
  testInt: 'not a number',
  testFloat: 'not a float'
});
