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
  // namespace = "PrismaJson"
  // clientOutput = "<finds it automatically>"
  // (./ -> relative to schema, or an importable path to require() it)
}

model Example {
  /// [MyType]
  normal Json

  /// [MyType]
  optional Json?

  /// [MyType]
  array Json[]
}
```

```ts
// index.ts

import type { Example } from '@prisma/client';

declare global {
  namespace PrismaJson {
    // you can use classes, interfaces, types, etc.
    type MyType = boolean;
  }
}

function myFunction(example: Example) {
  // example.normal   is now a boolean
  // example.optional is now a boolean | null
  // example.array    is now a boolean[]
}
```

### How it works

> ⚠️ **It just changes the declaration files of your generated client, no runtime code is
> affected!**

By using the Typescript Compiler API, this generator parses the generated client's types
AST and looks for `Prisma.JsonValue` types [_(or related)_](src/helpers/regex.ts) and
replaces them with their corresponding type.

### Some types are still json!

There are some complex json types like `JsonFilter` and `JsonWithAggregatesFilter` that,
if typed, would impact the usability of the client. So, they are still json.

### Limitations

- This project **should be** a temporary workaround _(and possible solution)_ to
  https://github.com/prisma/prisma/issues/3219.

- Json types inside `type` declarations won't work. (see
  https://github.com/prisma/prisma/issues/13726)
