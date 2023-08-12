<p align="center">
   <b>Using this package?</b> Please consider <a href="https://github.com/sponsors/arthurfiorette" target="_blank">donating</a> to support my open source work ❤️
</p>

<br />

[![Issues](https://img.shields.io/github/issues/arthurfiorette/prisma-json-types-generator?logo=github&label=Issues)](https://github.com/arthurfiorette/prisma-json-types-generator/issues)
[![Stars](https://img.shields.io/github/stars/arthurfiorette/prisma-json-types-generator?logo=github&label=Stars)](https://github.com/arthurfiorette/prisma-json-types-generator/stargazers)
[![License](https://img.shields.io/github/license/arthurfiorette/prisma-json-types-generator?logo=githu&label=License)](https://github.com/arthurfiorette/prisma-json-types-generator/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dw/prisma-json-types-generator?style=flat)](https://www.npmjs.com/package/prisma-json-types-generator)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/prisma-json-types-generator/latest?style=flat)](https://bundlephobia.com/package/prisma-json-types-generator@latest)
[![Packagephobia](https://packagephobia.com/badge?p=prisma-json-types-generator@latest)](https://packagephobia.com/result?p=prisma-json-types-generator@latest)

<h1 align=center>
⚒️ Prisma Json Types Generator
</h1>

<h3 align=center>
A generator that changes the Prisma Client output to strongly type Json fields
</h3>

<br />
<br />

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

/// Always after the prisma-client-js generator
generator json {
  provider = "prisma-json-types-generator"
}

model Example {
  /// [MyType]
  normal Json

  /// [MyType]
  optional Json?

  /// [MyType]
  array Json[]

  /// [ComplexType]
  complex Json

  /// ![number | string]
  literal Json
}
```

Provide type definitions in a file that is part of the `tsconfig.json#includes` paths. For
example:

```ts
// src/jsonTypes.ts

declare global {
  namespace PrismaJson {
    // you can use typical basic types
    type MyType = boolean;

    // or you can use classes, interfaces, object types, etc.
    type ComplexType = {
      foo: string;
      bar: number;
    };
  }
}
```

When you use your Prisma types in your application code, the JSON columns will now have
the types provided under the `PrismaJson` namespace.

```ts
// src/example.ts

import type { Example } from '@prisma/client';

function myFunction(example: Example) {
  // example.normal   is now a boolean
  // example.optional is now a boolean | null
  // example.array    is now a boolean[]
  // example.complex  is now a { foo: string; bar: number }
  // example.literal  is now a string | number
}
```

### Configuration

````ts
export interface PrismaJsonTypesGeneratorConfig {
  /**
   * The namespace to generate the types in.
   *
   * @default 'PrismaJson'
   */
  namespace: string;

  /**
   * The name of the client output type. By default it will try to find it automatically
   *
   * (./ -> relative to schema, or an importable path to require() it)
   *
   * @default undefined
   */
  clientOutput?: string;

  /**
   * In case you need to use a type, export it inside the namespace and we will add a
   * index signature to it
   *
   * @example
   *
   * ```ts
   * export namespace PrismaJson {
   *   export type GlobalType = {
   *     fieldA: string;
   *     fieldB: MyType;
   *   };
   * }
   * ```
   *
   * @default undefined
   */
  useType?: string;

  /**
   * If we should allow untyped JSON fields to be any, otherwise we change them to
   * unknown.
   *
   * @default false
   */
  allowAny?: boolean;
}
````

### How it works

> ⚠️ **It just changes the declaration files of your generated client, no runtime code is
> affected!**

By using the Typescript Compiler API, this generator parses the generated client's types
AST and looks for `Prisma.JsonValue` types [_(or related)_](src/helpers/regex.ts) and
replaces them with their corresponding type.

### Some types are still json!

There are some complex json types like `JsonFilter` and `JsonWithAggregatesFilter` that,
if typed, would impact the usability of the client. So, they are still json.

### Usage with monorepos

If you're working with a monorepo, you must make sure the file containing the global
definition for `namespace PrismaJson` is part of the runtime imports of your application.
If you don't, the types will silently fall back to `any`.

```ts
// package1/src/jsonTypes.ts
declare global {
  namespace PrismaJson { /* ... */ }
}

// package1/src/client.ts
import { PrismaClient } from '@prisma/client';
import './jsonTypes.ts'; // if this is omitted, types are silently `any` outside of `package1`

export const client = new PrismaClient(...);
export { Example } from '@prisma/client';
```

### Limitations

- This project **should be** a temporary workaround _(and possible solution)_ to
  https://github.com/prisma/prisma/issues/3219.

- Json types inside `type` declarations won't work. (see
  https://github.com/prisma/prisma/issues/13726)
