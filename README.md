<p align="center">
   <b>Using this package?</b> Please consider <a href="https://github.com/sponsors/arthurfiorette" target="_blank">donating</a> to support my open source work ❤️
  <br />
  <sup>
   If this project helps you, star the repository and share it with your co-workers.
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
> `prisma-json-types-generator@5+` only supports Prisma v7 and TypeScript v6.

<br />

<p align="center">
  <img src="https://raw.githubusercontent.com/arthurfiorette/prisma-json-types-generator/refs/heads/main/images/logo.png" />
</p>

<h1>Prisma Json Types Generator</h1>

> Your own TypeScript types for the `Json` and scalar fields of the Prisma client.

<br />

- [Installation](#installation)
- [Install the skill](#install-the-skill)
- [Configuration](#configuration)
- [Quick start](#quick-start)
- [Typing `String` fields (enums)](#typing-string-fields-enums)
- [Advanced typing](#advanced-typing)
  - [Examples](#examples)
- [TypedSQL](#typedsql)
- [Validating types at runtime](#validating-types-at-runtime)
- [How it works](#how-it-works)
- [Limitations](#limitations)
- [License](#license)

Prisma types every `Json` field as `JsonValue` and every `String` field as `string`. This generator replaces those types in the generated `@prisma/client` with TypeScript types you define, so the compiler checks the values you read and write.

It works with every database Prisma supports. Only the generated types change, so there is no runtime cost.

<br />

### Features

- Object shapes for `Json` fields, including `Json[]` lists.
- Literal unions for `String`, `Int` and `Float` fields, which gives you enums without native database enums.
- Types declared in a global namespace or written inline in the schema.
- Support for several `@prisma/client` generators at once, useful while moving the client to a new output location.

<br />

## Installation

```bash
npm install -D prisma-json-types-generator
```

## Install the skill

An agent skill for this generator is also available:

```bash
npx skills add arthurfiorette/prisma-json-types-generator
```

It teaches AI agents to set up the generator and to type Prisma `Json`, `String`, `Int` and `Float` fields with the `/// [Type]` and `/// ![Type]` syntax.

<br />

## Configuration

Options go in the generator block of `schema.prisma`:

```prisma
generator json {
  provider  = "prisma-json-types-generator"
  namespace = "PrismaJson"
  allowAny  = false
  // etc...
}
```

| Option           | Description                                                                                                                               | Default          |
| :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------- | :--------------- |
| `namespace`      | Global namespace that holds your custom types.                                                                                            | `"PrismaJson"`   |
| `clientOutput`   | Path to the `@prisma/client` output directory. It is detected automatically, so set it only when detection fails, as in some monorepos.   | (auto-detected)  |
| `allowAny`       | When `true`, untyped `Json` fields resolve to `any` instead of `unknown`.                                                                 | `false`          |
| `useType`        | Type in your namespace used for every untyped `Json` field. The generator adds an index signature `[key: string]: any` to it.             | `undefined`      |
| `typedSqlUrlEnv` | Environment variable with the PostgreSQL URL used to match [TypedSQL](#typedsql) columns to schema fields.                                | `"DATABASE_URL"` |
| `typedSqlPath`   | Directory of your [TypedSQL](#typedsql) `.sql` files, relative to the schema. Set it only if you changed `typedSql.path` in `prisma.config.ts`. | `"sql"`          |

<br />

## Quick start

1.  Add the generator to your schema

    Add a `json` generator block after the `client` generator in `schema.prisma`.

    ```prisma
    generator client {
      provider = "prisma-client"
    }

    generator json {
      provider = "prisma-json-types-generator"
    }
    ```

2.  Declare your types

    Create a declaration file such as `src/types.ts`, make sure your `tsconfig.json` includes it, and declare your types in the global `PrismaJson` namespace.

    ```ts
    // declare global only works inside a module, hence the empty export.
    export {};

    declare global {
      namespace PrismaJson {
        type UserProfile = {
          theme: 'dark' | 'light';
          twitterHandle?: string;
        };
      }
    }
    ```

3.  Link the types in your schema

    Add a `/// [TypeName]` AST comment above a `Json` field to give it that type.

    ```prisma
    model User {
      id    Int    @id @default(autoincrement())
      email String @unique

      /// [UserProfile]
      profile Json
    }
    ```

<br />

Run `npx prisma generate` and `User.profile` is typed as `PrismaJson.UserProfile`:

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

  // user.profile is PrismaJson.UserProfile
  console.log(user.profile.theme); // 'dark'
}
```

<br />

## Typing `String` fields (enums)

`String` fields can be typed as a union of string literals, which works as an enum without Prisma's native `enum` type and keeps the allowed values in your schema. Use the inline syntax, `/// ![Type]`:

```prisma
model Post {
  id    Int    @id @default(autoincrement())
  title String

  /// !['draft' | 'published' | 'archived']
  status String @default("draft")
}
```

`post.status` is then typed as `'draft' | 'published' | 'archived'`.

<br />

## Advanced typing

A field can reference a type from the namespace or have its type written inline:

1.  `/// [TypeName]` references a type in the `PrismaJson` namespace. Use it for complex or reused types.
2.  `/// ![Type]` takes a TypeScript type written in the schema. Use it for small one-off types such as unions or simple objects.

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

  // Numeric scalar literal unions
  /// ![1 | 2 | 3]
  priority Int

  /// ![1.5 | 2.5 | 3.5]
  weight Float

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

Notes:

- On list fields such as `tags Json[]`, annotate the element type (`/// [Tag]`). An array type like `/// ![Tag[]]` belongs on a plain `Json` field whose stored value is a JSON array.
- The same syntax works on `String`, `Int` and `Float` fields, nullable ones included.

<br />

## TypedSQL

Prisma types [TypedSQL](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/typedsql) results from the database alone, so `Json` columns come out as `JsonValue` and annotated `String` columns as `string`. When you run `prisma generate --sql`, this generator applies your types to them as well, with both `prisma-client` and `prisma-client-js`.

### Columns read from your models (PostgreSQL)

A result column that comes straight from a table column gets the type of the matching schema field, as model payloads do:

```prisma
model User {
  id      Int    @id
  /// [UserProfile]
  profile Json   @map("profile_data")
  /// [UserEmail]
  email   String
}
```

```sql
-- prisma/sql/getUsers.sql
WITH u AS (SELECT id, profile_data AS p, email FROM "User")
SELECT u.id, u.p AS profile, u.email AS contact FROM u
```

```ts
export namespace getUsers {
  export type Result = {
    id: number
    profile: PrismaJson.UserProfile // was $runtime.JsonValue
    contact: PrismaJson.UserEmail // was string
  }
}
```

The generator does not match columns by name. It asks PostgreSQL to describe the query, without running it, and PostgreSQL reports the source table and column of each result column. Aliases, joins, subqueries and CTEs are handled, and columns with the same name in different tables or schemas are kept apart. Nullability and `Json[]` arrays stay as Prisma inferred them.

Like `prisma generate --sql` itself, this needs a database connection:

- Install [`pg`](https://www.npmjs.com/package/pg). You already have it if you use `@prisma/adapter-pg`.
- The URL is read from `DATABASE_URL`, or from the variable named in the `typedSqlUrlEnv` option. Prisma does not pass the URL from `prisma.config.ts` to generators.

Without a connection, the generator prints a warning and applies only the `.sql` annotations described below.

### Annotating columns in the `.sql` file

Computed columns have no schema field, and databases other than PostgreSQL don't report where a column comes from. For these, add a `--` comment to the `.sql` file with the usual syntax followed by the column name. These annotations take priority over schema field annotations:

```sql
-- prisma/sql/getStats.sql
-- [UserStats] stats
-- ![{ total: number }] "Total Count"
SELECT
  json_build_object('posts', count(*)) AS stats,
  json_build_object('total', count(*)) AS "Total Count"
FROM "Post"
```

As with Prisma's `@param`, every line starting with `--` is read, so an annotation can also go next to its column. The name must match the returned column name. PostgreSQL lowercases unquoted names (`AS Stats` returns `stats`), so quote a name to keep its case.

### Parameters

Put the annotation at the start of the description in Prisma's `@param` tag:

```sql
-- @param {Json} $1:filter [PostFilter]
-- @param {String} $2:email [UserEmail]
SELECT id FROM "Post" WHERE meta @> $1 AND author_email = $2
```

Parameters without an annotation keep Prisma's type.

<br />

## Validating types at runtime

This generator only checks types at compile time. For runtime validation, derive the namespace types from a validation library such as Zod, so both checks come from one definition:

1.  Define the schema with Zod.
2.  Infer the TypeScript type from it.
3.  Expose that type in the `PrismaJson` namespace.

In `schema.prisma`:

```prisma
model User {
  id          Int    @id @default(autoincrement())

  /// [UserPreferences]
  preferences Json
}
```

In your type declaration file:

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

Other libraries with static type inference, such as TypeBox or Yup, work the same way.

<br />

## How it works

During `npx prisma generate`, Prisma passes the generator the Data Model Meta Format (DMMF), which contains your schema and its AST comments. Once the Prisma client is generated, the generator parses its output files (`index.d.ts` for `prisma-client-js`, `.ts` files for `prisma-client`) into an abstract syntax tree (AST) with the TypeScript Compiler API.

For each model property in the AST, it looks up the field's type comment in the DMMF. When there is one, the original type node (such as `Prisma.JsonValue` or `string`) is replaced with a node for your type. The modified AST is then printed back over the original file. See the [core implementation](./src/handler/replace-object.ts) for details.

<br />

## Limitations

- `JsonFilter` and `JsonWithAggregatesFilter` stay untyped so that filtering keeps working.
- `prisma-json-types-generator@5+` only supports Prisma v7 and TypeScript v6.
- If a `Json` field is not typed correctly, please [open an issue](https://github.com/arthurfiorette/prisma-json-types-generator/issues).

<br />

## License

Licensed under the MIT license. See [`LICENSE`](LICENSE).

<br />
