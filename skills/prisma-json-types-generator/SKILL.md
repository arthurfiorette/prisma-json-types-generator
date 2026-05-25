---
name: prisma-json-types-generator
description: Use when creating or updating typed Prisma `Json`, `String`, `String[]`, `Int`, or `Float` fields with prisma-json-types-generator, including `/// [Type]` and `/// ![Type]` comments, enum-like literal fields, inline vs named types, and generated types still showing `JsonValue`, `unknown`, or plain scalar types.
compatibility: Requires file read/edit access and is most useful when the Prisma schema, tsconfig, and TypeScript type declarations are available in the workspace.
---

# Prisma Json Types Generator

Make Prisma `Json`, `String`, `String[]`, `Int`, or `Float` fields type-safe with the smallest correct schema and type-definition change.

This only changes generated TypeScript types after `prisma generate`.

## Core Workflow

1. Read only what you need: the relevant Prisma schema, the existing `PrismaJson` wiring file if there is one, and `tsconfig.json` if the namespace declarations are not being picked up.
2. For first-time installation, generator wiring, or broken setup, read `references/setup.md` before editing fields.
3. Find the target field.
4. Decide whether it should use a named namespace type or a short inline type.
5. Add or fix the AST comment immediately above the field.
6. Add or update the TypeScript type if the field uses a named type.
7. Run `prisma generate` and a relevant type check when practical.

Prefer the smallest correct change. If the user only needs one typed field, do not redesign the whole schema.

## Choosing A Typing Style

Use namespace-based types for reusable or complex shapes. Use inline types only for shorter, simpler types.

```prisma [prisma/schema.prisma]
model User {
  /// [UserProfile]
  profile Json
}
```

```ts [src/types.ts]
import type { UserProfile as DomainUserProfile } from './domain/user-profile';

declare global {
  namespace PrismaJson {
    type UserProfile = DomainUserProfile;
  }
}
```

```prisma [prisma/schema.prisma]
model Post {
  /// !['draft' | 'published' | 'archived']
  status String

  /// ![1 | 2 | 3]
  rank Int

  /// ![{ theme: 'dark' | 'light'; twitterHandle?: string }]
  profile Json
}
```

## Field Rules

Apply the comment directly above the field it types.

- `/// [TypeName]` references a type in the configured namespace
- `/// ![TypeExpression]` inlines the full TypeScript type expression

Let Prisma carry nullability and array wrappers. Use `Json[]` with `/// [Tag]`, not `Json` with `Tag[]`, unless the JSON value itself should be an array.

```prisma [prisma/schema.prisma]
model User {
  /// [UserTag]
  tags Json[]

  /// [UserSettings]
  settings Json?
}
```

`String?` is supported the same way as other nullable fields.

Numeric scalar fields such as `Int`, `Int?`, `Float`, and `Float?` can also use named or inline literal-union types.

## Practical Heuristics

- Prefer namespace types for objects reused across models, large JSON payloads, or anything the user may validate with Zod later.
- Prefer inline types only for shorter and simpler field types.
- If the user mentions runtime validation, suggest sharing types from Zod or a similar library.
- If untyped `Json` shows up as `unknown`, that is expected unless `allowAny` or `useType` is configured.

## Troubleshooting

When the generated types still look wrong, check these in order:

1. The generator is present and points to `prisma-json-types-generator`.
2. The comment is `///`, not a normal `//` comment.
3. The comment sits immediately above the target field.
4. The namespace name in the generator matches the namespace in TypeScript.
5. The declaration file is a module, usually via `export {};`.
6. The declaration file is included by `tsconfig.json`.
7. Check generator output or error logs if typings still look wrong; `prisma generate` may still complete even when the final typings are not what the user expected.
8. The user is not expecting JSON filter types to be strongly typed; some filter helpers intentionally remain broad.

## Output Expectations

When you act on this skill:

- make the file edits, not just suggestions, when the workspace is available
- keep the diff local to the relevant schema and type files
- summarize what changed and why
- mention the exact verification commands you ran, or say that you could not run them

## Examples

```prisma [prisma/schema.prisma]
model User {
  /// [UserProfile]
  profile Json

  /// [UserSettings]
  settings Json?

  /// [UserTag]
  tags Json[]
}
```

```ts [src/types.ts]
export {};

declare global {
  namespace PrismaJson {
    type UserProfile = {
      theme: 'dark' | 'light';
      twitterHandle?: string;
    };

    type UserSettings = {
      locale: string;
    };

    type UserTag = string;
  }
}
```

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
