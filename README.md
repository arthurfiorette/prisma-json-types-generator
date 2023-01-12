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
  provider      = "prisma-client-js"
  binaryTargets = ["windows", "native"]
}

/// >>> ALWAYS PUT AFTER THE PRISMA CLIENT GENERATOR <<<
generator test {
  provider = "prisma-json-types-generator"
  namespace = "PrismaJson" // default
  output = "./custom.d.ts" // defaults to where the prisma client is generated.
  // uses ./ to resolve from this schema path, or an importable path to resolve with require.resolve
}

model Test {
  /// @json("NormalType")
  field Json

  /// @json("OptionalType")
  field2 Json

  /// @json("ArrayType")
  field3 Json
}
```

```ts
// index.ts

declare global {
  namespace PrismaJson {
    type NormalType = boolean;

    type OptionalType = { a: number } | null;

    type ArrayType = { a: number }[];

    // you can use classes, interfaces, types, etc.
  }
}
```

```ts
// myFile.ts

import { Test } from '@prisma/client';

const test: Test = {
  // Intellisense works!
};
```

### How it works

It works by using the typescript compiler api to interpret all emitted type declarations
and changes their field type in the original file.

> ⚠️ **It just changes the declaration files of your generated client, no runtime code is
> affected!**

### Limitations

- This project is a temporary workaround to https://github.com/prisma/prisma/issues/3219.
  (and possible solution).
- Json types inside `type` declarations won't work. (see
  https://github.com/prisma/prisma/issues/13726)
