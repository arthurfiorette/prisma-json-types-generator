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

<p align="center">
  <img src="https://raw.githubusercontent.com/arthurfiorette/prisma-json-types-generator/refs/heads/main/images/logo.png" />
</p>

<h1>Prisma Json Types Generator</h1>

> Generate your prisma client with strict JSON types and String literals!

<br />

- [Installation](#installation)
- [Usage](#usage)
- [Typing JSON Fields](#typing-json-fields)
  - [Example Schema](#example-schema)
  - [Example Type Declarations](#example-type-declarations)
  - [Resulting Type Inference](#resulting-type-inference)
- [Configuration Options](#configuration-options)
- [Limitations](#limitations)
- [Advanced Usage](#advanced-usage)
  - [Monorepos](#monorepos)
  - [Inline Type Declarations](#inline-type-declarations)
- [How It Works](#how-it-works)
- [License](#license)

<br />
<br />

Prisma JSON Types Generator enhances your `@prisma/client` by replacing all JSON types with your specified TypeScript types. This ensures a stricter type-checking layer, requiring your JSON types to conform to TypeScript rules before insertion into the database.

<br />

## Installation

Install the package as a development dependency:

```bash
npm install -D prisma-json-types-generator
```

<br />

## Usage

1. **Add the generator to your Prisma schema**:
   Place the generator below the `prisma-client-js` generator in your `schema.prisma`:

   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   generator json {
     provider = "prisma-json-types-generator"
   }
   ```

2. **Define your JSON types**:
   Create a TypeScript file containing the type declarations. This file must be included in your `tsconfig`.

   ```ts
   // types.ts

   declare global {
     namespace PrismaJson {
       // Define your custom types here!
     }
   }
   ```

<br />

## Typing JSON Fields

This generator allows multiple approaches to type `Json` or `String` fields, avoiding circular dependencies between the Prisma schema and your codebase. Global namespaces (`PrismaJson`) provide a centralized location for your type definitions.

### Example Schema

```prisma
model Example {
  /// [MyType]
  normal Json

  /// [MyType] comments are allowed after the type definition!
  comment Json

  /// [MyType]
  optional Json?

  /// [MyType]
  array Json[]

  /// [ComplexType]
  complex Json

  /// !['A' | 'B']
  literal Json

  /// ![[('A' | 'B')[], number[][][][]]]
  literalArray Json

  /// ![PrismaJson.MyType | 'none']
  anything Json[]
}
```

### Example Type Declarations

```ts
declare global {
  namespace PrismaJson {
    type MyType = boolean;
    type ComplexType = { foo: string; bar: number };
  }
}
```

### Resulting Type Inference

```ts
import type { Example } from '@prisma/client';

// example.normal   -> boolean
// example.optional -> boolean | null
// example.array    -> boolean[]
// example.complex  -> { foo: string; bar: number }
// example.literal  -> 'A' | 'B'
// example.anything -> PrismaJson.MyType | 'none'
```

<br />

## Configuration Options

```prisma
generator json {
  provider = "prisma-json-types-generator"

  // Specify the namespace for type generation.
  // Default: "PrismaJson"
  // namespace = "PrismaJson"

  // Define the client output path.
  // Default: Automatically determined.
  // clientOutput = "automatic"

  // Add an index signature to a root type for dynamic JSON fields.
  // useType = "GlobalType"

  // Use `any` instead of `unknown` for untyped JSON fields.
  // allowAny = false
}
```

<br />

## Limitations

- **Complex Filters**: Types like `JsonFilter` and `JsonWithAggregatesFilter` remain untyped to preserve functionality.
- **Prisma v4 Support**: Only Prisma v5+ and generator v3+ are supported.
- **Known Gaps**: If some JSON fields are missing types, open an issue in the repository.

<br />

## Advanced Usage

### Monorepos

In monorepos, ensure the file containing the `PrismaJson` namespace is part of the runtime imports. Otherwise, types will default to `any`.

```ts
// package1/src/types.ts

declare global {
  namespace PrismaJson {
    // Define types here
  }
}
```

```ts
// package2/src/client.ts

// Import the type definitions
import 'package1/types.ts';
import { PrismaClient } from '@prisma/client';

export const client = new PrismaClient();
```

### Inline Type Declarations

Directly declare types in the schema:

```prisma
model Example {
  /// ![Record<string, string>]
  map Json
}
```

<br />

## How It Works

This generator leverages the TypeScript Compiler API to analyze the client's type definitions. It identifies `Prisma.JsonValue` (or related) types and replaces them with the specified types using AST transformations. For details, see the [implementation](src/handler/replace-object.ts).

<br />

## License

Licensed under the **MIT**. See [`LICENSE`](LICENSE) for more informations.

<br />
