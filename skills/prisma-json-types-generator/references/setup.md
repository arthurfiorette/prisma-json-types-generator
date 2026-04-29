# Setup

Read this only when the project is missing `prisma-json-types-generator` setup or the existing setup looks wrong.

## What This Package Does

`prisma-json-types-generator` is a Prisma generator that rewrites generated Prisma TypeScript declarations after `prisma generate`.

- It adds compile-time typing for Prisma `Json` fields.
- It can also type `String`, `String?`, `String[]`, `Int`, `Int?`, `Float`, and `Float?` fields with the same AST comment syntax.
- It can express enum-like string and number literal types.
- It adds no runtime overhead.

## Version Support

- `prisma-json-types-generator@5+` supports Prisma v7 and TypeScript v6.
- If the project is on older Prisma or TypeScript versions, do not assume this setup will work unchanged.

## Install

Use the package as a dev dependency.

```bash [terminal]
npm install -D prisma-json-types-generator
```

```bash [terminal]
pnpm add -D prisma-json-types-generator
```

```bash [terminal]
yarn add -D prisma-json-types-generator
```

The project needs compatible Prisma packages, typically `prisma` and `@prisma/client`.

## Minimal Generator Setup

```prisma [prisma/schema.prisma]
generator client {
  provider = "prisma-client"
}

generator json {
  provider  = "prisma-json-types-generator"
  namespace = "PrismaJson"
}
```

Then run:

```bash [terminal]
npx prisma generate
```

## Generator Options

### `namespace`

The global namespace used by `/// [TypeName]` references.

- default: `PrismaJson`
- use when the schema references named types like `/// [UserProfile]`
- if you change it in `schema.prisma`, the TypeScript namespace must match exactly

```prisma [prisma/schema.prisma]
generator json {
  provider  = "prisma-json-types-generator"
  namespace = "PrismaJson"
}
```

### `clientOutput`

The path to the generated Prisma client output.

- default: auto-detected
- use only when auto-detection is not enough
- mainly useful when the project uses a custom Prisma client output path or a less standard Prisma layout where auto-detection misses the right client

```prisma [prisma/schema.prisma]
generator json {
  provider     = "prisma-json-types-generator"
  clientOutput = "../generated/prisma"
}
```

### `allowAny`

Controls the fallback for untyped `Json` fields.

- default: `false`
- `false`: untyped `Json` becomes `unknown`
- `true`: untyped `Json` becomes `any`

Prefer `false` unless the user explicitly wants looser typing.

```prisma [prisma/schema.prisma]
generator json {
  provider = "prisma-json-types-generator"
  allowAny = false
}
```

### `useType`

Sets a root namespace type used as a fallback for untyped `Json` fields.

- default: unset
- use when the user wants unannotated `Json` fields to resolve through one shared type instead of `unknown`
- this is fallback behavior, not the normal path for clearly typed fields
- important: this adds an index signature like `[key: string]: any` to that root type, so it is not the strict option

```prisma [prisma/schema.prisma]
generator json {
  provider = "prisma-json-types-generator"
  useType  = "MyOwnType"
}
```

```ts [src/types.ts]
export {};

declare global {
  namespace PrismaJson {
    type MyOwnType = {
      Simple: 1;
      Optional: 2;
      List: 3;
    };
  }
}
```

## Type Declaration Shape

For named types, keep a single wiring file that defines the `PrismaJson` namespace and imports the real type definitions from wherever the project stores them.

```ts [src/types.ts]
import type { UserProfile as DomainUserProfile } from './domain/user-profile';

declare global {
  namespace PrismaJson {
    type UserProfile = DomainUserProfile;
  }
}
```

Important details:

- the file must be included by `tsconfig.json`
- the file should stay a module, usually by keeping `export {}` at the top
- the namespace name must match the generator `namespace` option exactly
- the actual source types can live anywhere; this file is just the bridge into `PrismaJson`

## Field Syntax

### Named Namespace Type

Use this for reusable or larger shapes.

```prisma [prisma/schema.prisma]
model User {
  /// [UserProfile]
  profile Json
}
```

### Inline Type

Use this for one-off shapes.

```prisma [prisma/schema.prisma]
model User {
  /// ![{ theme: 'dark' | 'light'; twitterHandle?: string }]
  profile Json
}
```

Inline types are also useful for short enum-like fields.

```prisma [prisma/schema.prisma]
model Post {
  /// !['draft' | 'published' | 'archived']
  status String

  /// ![1 | 2 | 3]
  rank Int

  /// ![1.5 | 2.5 | 3.5]
  weight Float
}
```

## Supported Field Patterns

Common patterns covered by this package:

- `Json`
- `Json?`
- `Json[]`
- `String`
- `String?`
- `String[]`
- `Int`
- `Int?`
- `Float`
- `Float?`

Important:

```prisma [prisma/schema.prisma]
model Product {
  /// [ProductMeta]
  meta Json?

  /// [Tag]
  tags Json[]

  /// !['physical' | 'digital']
  kind String

  /// [StringArrayType]
  labels String[]
}
```

For array fields, keep the Prisma field as the array and keep the type as the element shape. Use `tags Json[]` with `/// [Tag]`, not `tags Json` with an array type unless the JSON value itself should be an array.

## Setup Flow

When onboarding a project, follow this order:

1. Install the package.
2. Add the `generator json` block.
3. Add a TypeScript declaration file for namespace types if needed.
4. Add `/// [Type]` or `/// ![Type]` comments above the target fields.
5. Run `prisma generate`.
6. Run a type check if the project has one.

## Runtime Validation

If the user also needs runtime validation, share types from a schema library such as Zod.

## Useful Things To Know

- The magic comes from AST comments in the Prisma schema. Use `///`, not `//`.
- The comment must sit immediately above the field it types.
- The package rewrites generated declaration files, so `prisma generate` is the moment that matters.
- If typings still look wrong, inspect generator output and error logs; generation can finish while the result is still not what the user expected.
- If a field is still `JsonValue`, `unknown`, or `string`, check setup first before changing the model more broadly.
- `unknown` is the expected fallback for untyped `Json` fields unless `allowAny` or `useType` changes that behavior.

## Limits And Gotchas

- `JsonFilter` and `JsonWithAggregatesFilter` stay broad by design.
- Some typing problems may come from TypeScript not seeing the namespace file, not from Prisma itself.
- Do not imply database-level or runtime enforcement; this package only affects generated TypeScript types.
