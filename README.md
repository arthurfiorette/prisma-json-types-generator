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

> [!IMPORTANT]  
> **Maintenance Status Update:** This project's maintenance approach has changed. Please see [this issue](https://github.com/arthurfiorette/prisma-json-types-generator/issues/542) for details about what this means for users and the project's future.

<br />

<p align="center">
  <img src="https://raw.githubusercontent.com/arthurfiorette/prisma-json-types-generator/refs/heads/main/images/logo.png" />
</p>

<h1>Prisma Json Types Generator</h1>

> Generate your prisma client with strict JSON types and String literals!

<br />

- [Installation](#installation)
- [Configuration](#configuration)
- [Quick Start](#quick-start)
- [Typing `String` Fields (Enums)](#typing-string-fields-enums)
- [Advanced Typing](#advanced-typing)
  - [Examples](#examples)
- [Validating Types at Runtime](#validating-types-at-runtime)
- [Limitations](#limitations)
- [How It Works](#how-it-works)
- [License](#license)

<br />
<br />

Supercharge your `@prisma/client` by adding strong, custom types to `Json` and `String` fields. This generator enhances type safety by replacing Prisma's default `JsonValue` with your own TypeScript types, ensuring data conforms to your schema before it even reaches the database.

It works with **all database drivers** supported by Prisma (PostgreSQL, MySQL, SQLite, etc.) **without affecting any runtime code**.

<br />

### Key Features

- **Strongly Typed `Json`:** Define complex object shapes for your `Json` fields.
- **String-Based Enums:** Type `String` fields to create enums without needing native database enums.
- **Full Type-Safety:** Get autocomplete, intellisense, and compile-time checks for your data structures.
- **Zero Runtime Overhead:** All transformations happen at generation time.
- **Flexible Typing:** Define types globally in a namespace or inline directly in your schema.

<br />

## Installation

Install the package as a development dependency in your project.

```bash
npm install -D prisma-json-types-generator
```

<br />

## Configuration

You can configure the generator in your `schema.prisma` file.

```prisma
generator json {
  provider  = "prisma-json-types-generator"
  namespace = "PrismaJson"
  allowAny  = false
  // etc...
}
```

| Option         | Description                                                                                                                                                              | Default         |
| :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------- |
| `namespace`    | The global namespace where your custom types are defined.                                                                                                                | `"PrismaJson"`  |
| `clientOutput` | Path to the `@prisma/client` output directory. The generator usually finds this automatically, but you can specify it if needed (e.g., in complex monorepos).            | (auto-detected) |
| `allowAny`     | If `true`, untyped `Json` fields will resolve to `any`. If `false`, they will resolve to `unknown` for stricter type safety.                                             | `false`         |
| `useType`      | Specifies a root type within your namespace to use as a fallback for all untyped `Json` fields. This adds an index signature `[key: string]: any` to the specified type. | `undefined`     |

<br />

## Quick Start

Follow these three steps to get started.

1.  Add the Generator to Your Schema

    In your `schema.prisma` file, add the `json` generator block below the default `client` generator.

    ```prisma
    generator client {
      provider = "prisma-client-js"
    }

    generator json {
      provider = "prisma-json-types-generator"
    }
    ```

2.  Define Your Custom Types

    Create a type declaration file (e.g., `src/types.ts`) and ensure it's included in your `tsconfig.json`. Define your types inside the `PrismaJson` global namespace.

    ```ts
    // This file must be a module, so we include an empty export.
    export {};

    declare global {
      namespace PrismaJson {
        // Define a type for a user's profile information.
        type UserProfile = {
          theme: 'dark' | 'light';
          twitterHandle?: string;
        };
      }
    }
    ```

3.  Link Types in Your Prisma Schema

    Use an AST comment (`/// [TypeName]`) above a `Json` field in your `schema.prisma` to link it to your custom type.

    ```prisma
    model User {
      id    Int    @id @default(autoincrement())
      email String @unique

      /// [UserProfile]
      profile Json
    }
    ```

<br />

Now, run `npx prisma generate`. The `profile` field on the `User` model will be strongly typed!

```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateUserProfile() {
  const user = await prisma.user.update({
    where: { id: 1 },
    data: {
      profile: {
        theme: 'dark'
        // twitterHandle is optional
      }
    }
  });

  // user.profile is now fully typed as UserProfile!
  console.log(user.profile.theme); // 'dark'
}
```

<br />

## Typing `String` Fields (Enums)

You can use the same technique to type `String` fields, which is perfect for creating "string enums" without using Prisma's native `enum` type. This is useful for maintaining a set of allowed values directly in your application code.

Use the inline type syntax (`/// ![Type]`) for this.

```prisma
model Post {
  id    Int    @id @default(autoincrement())
  title String

  /// !['draft' | 'published' | 'archived']
  status String @default("draft")
}
```

After generating, `post.status` will be correctly typed as `'draft' | 'published' | 'archived'`.

<br />

## Advanced Typing

The generator offers two ways to define types:

1.  **Namespace-based (`/// [TypeName]`):** References a type from the `PrismaJson` namespace. Best for complex, reusable types.
2.  **Inline (`/// ![Type]`):** Defines the type directly in the schema. Best for simple, one-off types like enums or basic objects.

### Examples

```prisma
model Product {
  id Int @id

  // Namespace-based type
  /// [ProductMeta]
  meta Json?

  // Array of namespace-based types
  /// [Tag]
  tags Json[]

  // Inline union type (enum)
  /// !['physical' | 'digital']
  type String

  // Inline object type
  /// ![{ width: number; height: number }]
  dimensions Json
}
```

```ts
export {};

declare global {
  namespace PrismaJson {
    type ProductMeta = {
      sku: string;
      stock: number;
    };

    type Tag = {
      id: string;
      name: string;
    };
  }
}
```

<br />

## Validating Types at Runtime

This generator provides compile-time type safety, not runtime validation. You can, however, share types from a runtime validation library like Zod to create a single source of truth for your data structures.

The principle is simple:

1.  Define your schema using Zod.
2.  Infer the static TypeScript type from that schema.
3.  Expose the inferred type within the `PrismaJson` namespace.

This pattern gives you both runtime validation and compile-time type safety from a single definition.

First, define your model in `schema.prisma`.

```prisma
model User {
  id          Int    @id @default(autoincrement())

  /// [UserPreferences]
  preferences Json
}
```

Then, define the Zod schema and expose its inferred type in your TypeScript definitions file.

```typescript
import { z } from 'zod';

// 1. Define the Zod schema as the source of truth.
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  language: z.string().optional()
});

// 2. Expose the inferred type to Prisma.
declare global {
  namespace PrismaJson {
    type UserPreferences = z.infer<typeof UserPreferencesSchema>;
  }
}
```

This same principle can be applied to other validation libraries like TypeBox or Yup that allow for static type inference.

<br />

## Limitations

- **Complex Filters:** To preserve functionality, types like `JsonFilter` and `JsonWithAggregatesFilter` remain untyped.
- **Prisma Version:** This generator supports Prisma v5+ and generator v3+.
- **Known Gaps:** If you find any `Json` fields that are not being typed correctly, please [open an issue](https://github.com/arthurfiorette/prisma-json-types-generator/issues).

<br />

## How It Works

This tool operates as a standard Prisma generator. When `npx prisma generate` runs, the generator receives the Data Model Meta Format (DMMF), which contains your full schema, including the AST comments. After `prisma-client-js` finishes, this generator targets its output declaration file (e.g., `index.d.ts`) and parses it into an Abstract Syntax Tree (AST) using the TypeScript Compiler API.

It then traverses this AST, and for each property signature in a model, it cross-references the DMMF to find a corresponding type comment. If a match is found, it performs a direct AST transformation, replacing the original type node (like `Prisma.JsonValue` or `string`) with a new node representing your custom type. Finally, the modified AST is printed back into TypeScript code, overwriting the original declaration file. This entire process occurs at build time and adds no runtime overhead. For a deeper dive, see the [core implementation](./src/handler/replace-object.ts).

<br />

## License

Licensed under the **MIT**. See [`LICENSE`](LICENSE) for more informations.

<br />
