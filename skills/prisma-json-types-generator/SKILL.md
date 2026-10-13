---
name: prisma-json-types-generator
description: Use when adding or fixing types on Prisma `Json`, `String`, `String[]`, `Int`, or `Float` fields with prisma-json-types-generator, including `/// [Type]` and `/// ![Type]` comments, enum-like literal unions, namespace vs inline types, TypedSQL result columns and parameters, and generated types that still show `JsonValue`, `unknown`, or a plain scalar.
compatibility: Requires file read/edit access and is most useful when the Prisma schema, tsconfig, and TypeScript type declarations are available in the workspace.
---

# prisma-json-types-generator

The generator gives Prisma `Json`, `String`, `String[]`, `Int`, and `Float` fields TypeScript types taken from comments in the schema. It only rewrites the types emitted by `prisma generate`. Nothing is checked at runtime or by the database.

## Workflow

1. Read the relevant Prisma schema and, if it exists, the file that declares the `PrismaJson` namespace. Read `tsconfig.json` only when the namespace declarations are not picked up.
2. If the generator is not installed or its setup looks broken, read `references/setup.md` before editing fields.
3. Choose a namespace type or an inline type for the field.
4. Add or fix the `///` comment directly above the field.
5. For a namespace type, add or update its declaration.
6. Run `prisma generate` (`prisma generate --sql` when the project uses TypedSQL) and the project's type check when you can.

Change only the fields the user asked about.

## Namespace or inline types

`/// [TypeName]` references `TypeName` in the configured namespace, `PrismaJson` by default. Use it for objects, types shared by several fields, and anything that may get a Zod schema later.

`/// ![Type]` takes a TypeScript type expression written in the schema. Use it for short literal unions and small one-off objects.

```prisma [prisma/schema.prisma]
model Post {
  /// [PostMeta]
  meta Json

  /// !['draft' | 'published' | 'archived']
  status String

  /// ![1 | 2 | 3]
  rank Int

  /// ![{ width: number; height: number }]
  dimensions Json
}
```

The namespace declaration file must be a module included by `tsconfig.json`. The types themselves can be defined anywhere and aliased into the namespace:

```ts [src/types.ts]
import type { PostMeta as DomainPostMeta } from './domain/post-meta';

declare global {
  namespace PrismaJson {
    type PostMeta = DomainPostMeta;
  }
}
```

A declaration file without any import needs `export {};` to stay a module.

## Field rules

- The comment uses `///`. Prisma leaves plain `//` comments out of the DMMF the generator reads.
- The comment goes directly above the field it types.
- Prisma keeps the nullability and list wrappers, so the type describes a single element. Use `tags Json[]` with `/// [Tag]`. An array type such as `/// ![Tag[]]` belongs on a plain `Json` field whose stored value is a JSON array.
- Nullable fields (`Json?`, `String?`, `Int?`, `Float?`) and `String[]` take the same comments.
- Fields of MongoDB composite `type` blocks can be typed the same way as model fields.
- Untyped `Json` fields resolve to `unknown` unless the generator sets `allowAny` or `useType`.

## TypedSQL

With `prisma generate --sql`, the generator also types TypedSQL results and parameters, for both `prisma-client` and `prisma-client-js`.

On PostgreSQL, a result column read straight from a table column gets the type of that schema field, through aliases, joins, subqueries, and CTEs. Matching asks the database for each column's source and never compares names. It needs the `pg` package and a connection URL in `DATABASE_URL`, or in the variable named by the `typedSqlUrlEnv` option. Without them the generator prints a warning and applies only the `.sql` annotations.

Computed columns, and every column on other databases, are typed with a `--` comment in the `.sql` file: the usual syntax followed by the returned column name. These annotations override the schema field type. Parameters are typed at the start of their `@param` description.

```sql [prisma/sql/getStats.sql]
-- [UserStats] stats
-- ![{ total: number }] "Total Count"
-- @param {Json} $1:filter [PostFilter]
SELECT
  json_build_object('posts', count(*)) AS stats,
  json_build_object('total', count(*)) AS "Total Count"
FROM "Post"
WHERE meta @> $1
```

PostgreSQL lowercases unquoted column names (`AS Stats` returns `stats`), and the annotation must use the returned name. When the queries are not in `sql/` next to the schema, set the `typedSqlPath` option.

## Troubleshooting

If a field still shows `JsonValue`, `unknown`, or a plain scalar, check in this order:

1. A generator block with `provider = "prisma-json-types-generator"` exists.
2. The comment starts with `///` and sits directly above the field.
3. The `namespace` option matches the namespace declared in TypeScript.
4. The declaration file is a module and `tsconfig.json` includes it.
5. `prisma generate` ran after the schema change. Generator errors and warnings are printed while the command can still exit successfully, so read its output.
6. For TypedSQL, `--sql` was passed, `pg` is installed, the URL variable is set, and annotation names match the returned column names.

`JsonFilter` and `JsonWithAggregatesFilter` stay untyped on purpose. Do not try to type filter inputs.

## Finishing

- Edit the files when the workspace is available instead of only suggesting changes.
- Keep the diff to the schema and type declaration files involved.
- Report what changed and the verification commands you ran, or say that you could not run them.
