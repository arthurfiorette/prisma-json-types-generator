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
}

/// >>> ALWAYS PUT AFTER THE PRISMA CLIENT GENERATOR <<<
generator test {
  provider = "prisma-json-types-generator"
  // namespace = "PrismaJson"
  // clientOutput = ".prisma/client" // (./ -> relative to schema, or an importable path to require() it)
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

### Some types are still json!

There's some complex json types like `JsonFilter` and `JsonWithAggregatesFilter` that
still aren't supported. Feel free to make a PR!

https://github.com/arthurfiorette/prisma-json-types-generator/blob/9b2ceea0a8372629d224287a5590dbce1f0ca6dd/src/handler/module.ts#L92-L98

### Limitations

- This project is a temporary workaround _(and possible solution)_ to https://github.com/prisma/prisma/issues/3219.
- Json types inside `type` declarations won't work. (see
  https://github.com/prisma/prisma/issues/13726)
