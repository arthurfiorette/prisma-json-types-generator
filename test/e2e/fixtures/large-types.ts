// Pulls the large schema outputs of test/e2e/generate.test.ts into the TypeScript 7 check

import type { M0 as OldM0 } from '../../target/large/out-js';
import type { M0 as NewM0 } from '../../target/large/out-new/client';

declare global {
  export namespace BenchJson {
    export type Data = { data: true };
    export type Opt = { opt: true };
    export type List = { list: true };
    export type Name = 'a' | 'b';
  }
}

export const models: [NewM0, OldM0] = [
  { id: 1, data: { data: true }, opt: null, list: [], name: 'a', count: 1, other: null },
  { id: 1, data: { data: true }, opt: null, list: [], name: 'b', count: 2, other: null }
];
