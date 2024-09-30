<p align="center">
   <b>Using this package?</b> Please consider <a href="https://github.com/sponsors/arthurfiorette" target="_blank">donating</a> to support my open source work ❤️
  <br />
  <sup>
   Help prisma-json-types-generator grow! Star and share this amazing repository with your friends and co-workers!
  </sup>
</p>

<br />

<p align="center">
  <a title="MIT license" target="_blank" href="https://github.com/arthurfiorette/prisma-json-types-generator/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/arthurfiorette/prisma-json-types-generator"></a>
  <a title="NPM Package" target="_blank" href="https://www.npmjs.com/package/prisma-json-types-generator"><img alt="Downloads" src="https://img.shields.io/npm/dw/prisma-json-types-generator?style=flat"></a>
  <a title="Install size" target="_blank" href="https://packagephobia.com/result?p=prisma-json-types-generator@latest"><img alt="Packagephobia" src="https://packagephobia.com/badge?p=prisma-json-types-generator@latest"></a>
  <a title="Last Commit" target="_blank" href="https://github.com/arthurfiorette/prisma-json-types-generator/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/arthurfiorette/prisma-json-types-generator"></a>
  <a title="Blazingly fast" target="_blank" href="https://twitter.com/acdlite/status/974390255393505280"><img src="https://img.shields.io/badge/blazingly-fast-fa3737"/></a>

</p>

<br />
<br />

<h1>Prisma Json Types Generator</h1>

> Generate your prisma client with strict JSON types and String literals!

<br />

- [Using it!](#using-it)
- [Configuration](#configuration)
- [Available types](#available-types)
- [Some types are still JSON?](#some-types-are-still-json)
- [Usage within monorepos](#usage-within-monorepos)
- [Limitations](#limitations)
- [How it works](#how-it-works)
- [License](#license)

<br />
<br />

Prisma Json Types Generator is a prisma client generator which changes all json types from
your `@prisma/client` into the ones you specified. It adds another layer of checking
within your schema, as you must make typescript happy with your json type before inserting
it into your DB.

<br />

```prisma
generator client {
  provider = "prisma-client-js"
}

generator json {
  provider = "prisma-json-types-generator"
}

model Example {
  /// [MyType]
  normal Json
}
```

<br />

## Using it!

```sh
npm install -D prisma-json-types-generator
```

Include it in your schema and provide your own namespace declarations inside a file
**included in your tsconfig**.

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

/// Always after the prisma-client-js generator
generator json {
  provider = "prisma-json-types-generator"
}
```

```ts
// types.ts

declare global {
  namespace PrismaJson {
    // Insert your types here!
  }
}
```

<br />

## Configuration

```prisma
generator json {
  provider = "prisma-json-types-generator"

  // The namespace to generate the types in.
  //
  // namespace = "PrismaJson"

  // The name of the client output type. By default it will try
  // to find it automatically
  // (./ -> relative to schema, or an importable path to require() it)
  //
  // clientOutput = "finds automatically"

  // In case you need to use a root type inside PrismaJson, export it
  // inside the namespace and we will add a index signature to it
  //
  // useType = "PrismaJson.GlobalType"

  // If untyped JSON fields should be any instead of `unknown`.
  //
  // allowAny = false
}
```

<br />

## Available types

This package adds multiple ways to type a `JSON` or `String` field.

We need to avoid circular dependencies between the prisma schema and your codebase, and
typescript namespaces are the best way to solve this. As we declare a global namespace,
any type declared within a normal declaration (`/// [T]`) gets transpiled to `Namespace.T`
inside the prisma schema.

Sometimes you have a very simple type, like a union literal or some constants, using a
literal declaration (`/// ![T]`) will probably be better, as it gets transpiled to onlt
`T` inside the schema. This way, types like `/// ['some' | 'none']` that are only used
once, are way more easy to write and maintain.

```prisma
model Example {
  /// [MyType]
  normal Json

  /// [MyType]
  optional Json?

  /// [MyType]
  array Json[]

  /// [ComplexType]
  complex Json

  /// !['A' | 'B']
  literal Json

  /// ![PrismaJson.MyType | 'none']
  anything Json[]
}
```

```ts
declare global {
  // you can use typical basic types
  // or you can use classes, interfaces, object types, etc.
  namespace PrismaJson {
    type MyType = boolean;
    type ComplexType = { foo: string; bar: number };
  }
}
```

And now, your types are correctly typed:

```ts
import type { Example } from '@prisma/client';

// example.normal   is now a boolean
// example.optional is now a boolean | null
// example.array    is now a boolean[]
// example.complex  is now a { foo: string; bar: number }
// example.literal  is now a 'A' | 'B'
// example.anything is now a boolean | 'none'
```

<br />

## Some types are still JSON?

Yes! And it is right!

Complex filter types like `JsonFilter` or `JsonWithAggregatesFilter` must not be typed. As
we cannot change the object signature, _(only its types)_ mutating these objects would
make the usage less powerful and probably lose functionality.

So no, not all types will be converted. However if you find a field which is missing
types, please open an issue in this repository.

<br />

## Usage within monorepos

If you're working with a monorepo, you must make sure the file containing the global
definition for namespace `PrismaJson` is part of the runtime imports of your application.
If you don't, the types will silently fall back to any.

```ts
// package1/src/types.ts

declare global {
  namespace PrismaJson {
    // ...
  }
}
```

```ts
// package2/src/client.ts

// Manually import the definition.
import 'package1/types.ts';
import { PrismaClient } from '@prisma/client';

export const client = new PrismaClient(...);
```

You can also declare the type on the spot using the following syntax:

```prisma
model Example {
  /// ![Record<string, string>]
  map Json
}
```

## Limitations

- This project should be a temporary workaround (and possible solution) to
  [prisma/prisma#3219](https://github.com/prisma/prisma/issues/3219).
- No more support to prisma v4 is being done. Please migrate to prisma v5+,
  prisma-json-types-generator v3+

<br />

## How it works

By using the Typescript Compiler API, this generator parses the generated client's types
AST and looks for `Prisma.JsonValue` [_(or related)_](src/helpers/find-signature.ts) types
and [replaces](src/handler/replace-object.ts) them with their corresponding type.

<br />

## License

Licensed under the **MIT**. See [`LICENSE`](LICENSE) for more informations.

<br />
