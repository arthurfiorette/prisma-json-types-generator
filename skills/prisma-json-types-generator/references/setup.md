# Setup

Read this when the project does not have `prisma-json-types-generator` set up yet or the existing setup looks wrong.

## Requirements

`prisma-json-types-generator@5+` requires Prisma 7.8 or later, with `prisma` and `@prisma/client` installed. It bundles its own TypeScript compiler. On older Prisma versions, do not assume this setup works unchanged.

TypedSQL column matching also needs [`pg`](https://www.npmjs.com/package/pg), an optional peer dependency. Projects using `@prisma/adapter-pg` already have it.

## Install

Install it as a dev dependency with the project's package manager:

```bash [terminal]
npm install -D prisma-json-types-generator
pnpm add -D prisma-json-types-generator
yarn add -D prisma-json-types-generator
```

## Generator block

Add a `json` generator after the client generator:

```prisma [prisma/schema.prisma]
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

generator json {
  provider = "prisma-json-types-generator"
}
```

The generator also works with `prisma-client-js` and with several client generators in one schema.

Then run:

```bash [terminal]
npx prisma generate
```

## Options

All options go in the `json` generator block.

| Option           | Default          | Use                                                                                                                                                                  |
| :--------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `namespace`      | `"PrismaJson"`   | Global namespace that `/// [TypeName]` resolves against. The TypeScript declaration must use the same name.                                                          |
| `clientOutput`   | auto-detected    | Path to the generated client, relative to the schema or as an importable path. Set it only when detection picks the wrong client.                                   |
| `allowAny`       | `false`          | When `true`, untyped `Json` fields become `any` instead of `unknown`. Keep `false` unless the user asks for looser types.                                           |
| `useType`        | unset            | Namespace type used for every untyped `Json` field. The generator adds an index signature `[key: string]: any` to it, so it is less strict than per-field types.    |
| `typedSqlUrlEnv` | `"DATABASE_URL"` | Environment variable holding the PostgreSQL URL used to match TypedSQL columns to schema fields. Prisma does not pass the URL from `prisma.config.ts` to generators. |
| `typedSqlPath`   | `"sql"`          | Directory of the TypedSQL `.sql` files, relative to the schema. Set it only when `typedSql.path` in `prisma.config.ts` was changed.                                  |

```prisma [prisma/schema.prisma]
generator json {
  provider     = "prisma-json-types-generator"
  namespace    = "PrismaJson"
  clientOutput = "../generated/prisma"
  useType      = "UntypedJson"
}
```

## Type declaration file

Named types need one file that declares the namespace. It must be included by `tsconfig.json` and must be a module, either through an import or an `export {};`.

```ts [src/types.ts]
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

The real types can live elsewhere in the project and be aliased into the namespace from this file.

## Onboarding order

1. Install the package.
2. Add the `json` generator block.
3. Add the type declaration file if any field uses a namespace type.
4. Add `/// [Type]` or `/// ![Type]` comments above the target fields.
5. Run `prisma generate`, adding `--sql` if the project uses TypedSQL.
6. Run the project's type check.

## Runtime validation

The generator only affects TypeScript types. If the user also wants runtime validation, define the schema with Zod (or another library with type inference) and alias the inferred type into the namespace:

```ts [src/types.ts]
import { z } from 'zod';

export const UserProfileSchema = z.object({
  theme: z.enum(['dark', 'light']),
  twitterHandle: z.string().optional()
});

declare global {
  namespace PrismaJson {
    type UserProfile = z.infer<typeof UserProfileSchema>;
  }
}
```
