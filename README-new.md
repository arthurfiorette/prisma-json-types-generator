<p align="center">
  <img src="https://raw.githubusercontent.com/arthurfiorette/prisma-json-types-generator/refs/heads/main/images/logo.png" />
</p>

# Prisma JSON Types Generator

**Transform your Prisma `Json` and `String` fields into strongly-typed TypeScript!**

Stop fighting with `any` and `JsonValue` types. This generator automatically adds strict TypeScript types to your Prisma Client, giving you full autocomplete and type safety for JSON fields and string enums.

<p align="center">
  <a href="https://github.com/sponsors/arthurfiorette" target="_blank">❤️ Support this project</a> • 
  <a href="https://github.com/arthurfiorette/prisma-json-types-generator">⭐ Star on GitHub</a>
</p>

<p align="center">
  <a href="https://github.com/arthurfiorette/prisma-json-types-generator/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/arthurfiorette/prisma-json-types-generator"></a>
  <a href="https://www.npmjs.com/package/prisma-json-types-generator"><img alt="Downloads" src="https://img.shields.io/npm/dw/prisma-json-types-generator?style=flat"></a>
  <a href="https://packagephobia.com/result?p=prisma-json-types-generator@latest"><img alt="Install size" src="https://packagephobia.com/badge?p=prisma-json-types-generator@latest"></a>
  <a href="https://github.com/arthurfiorette/prisma-json-types-generator/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/arthurfiorette/prisma-json-types-generator"></a>
</p>

## What Does It Do?

This generator reads special comments in your Prisma schema and transforms generic types into your custom TypeScript types:

**Before:**
```ts
// user.profile is typed as Prisma.JsonValue (basically 'any')
const user = await prisma.user.findFirst();
user.profile.theme; // No autocomplete, no type safety 😢
```

**After:**
```ts
// user.profile is typed as UserProfile
const user = await prisma.user.findFirst();
user.profile.theme; // Full autocomplete! Type safety! 🎉
// TypeScript knows theme is 'dark' | 'light'
```

## Quick Start

### 1. Install

```bash
npm install -D prisma-json-types-generator
```

### 2. Add to Prisma Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

generator json {
  provider = "prisma-json-types-generator"
  // Optional: Use a different namespace than the default "PrismaJson"
  // namespace = "PrismaJson"
}
```

### 3. Define Your Types

Create a TypeScript file (e.g., `types/prisma-json.ts`):

```ts
export {}; // Makes this a module

declare global {
  namespace PrismaJson {
    // Define your JSON field types here
    type UserProfile = {
      bio?: string;
      theme: 'dark' | 'light';
      notifications: {
        email: boolean;
        push: boolean;
      };
    };
  }
}
```

### 4. Link Types in Schema

Add a special comment above your field:

```prisma
model User {
  id      Int    @id @default(autoincrement())
  email   String @unique
  
  /// [UserProfile]
  profile Json
}
```

### 5. Generate!

```bash
npx prisma generate
```

That's it! Your `profile` field is now strongly typed.

## Common Use Cases

### JSON Fields with Complex Objects

Perfect for storing structured data like user preferences, metadata, or configuration:

```prisma
model Product {
  id Int @id
  
  /// [ProductMetadata]
  metadata Json
  
  /// [PricingTiers]
  pricing  Json
}
```

```ts
declare global {
  namespace PrismaJson {
    type ProductMetadata = {
      weight: number;
      dimensions: { width: number; height: number; depth: number };
      tags: string[];
    };
    
    type PricingTiers = Array<{
      quantity: number;
      pricePerUnit: number;
    }>;
  }
}
```

### String Enums Without Database Enums

Create type-safe string enums without modifying your database:

```prisma
model Order {
  id Int @id
  
  /// !['pending' | 'processing' | 'shipped' | 'delivered']
  status String @default("pending")
  
  /// !['standard' | 'express' | 'overnight']
  shipping String
}
```

Now TypeScript enforces these exact string values:

```ts
// ✅ Works
await prisma.order.create({
  data: { status: 'pending', shipping: 'express' }
});

// ❌ TypeScript error!
await prisma.order.create({
  data: { status: 'cancelled', shipping: 'express' }
});
```

### Optional and Nullable Fields

The generator preserves Prisma's optional and nullable semantics:

```prisma
model Article {
  id Int @id
  
  /// [ArticleMetadata]
  metadata  Json?  // Optional (can be undefined)
  
  /// [AuthorInfo]  
  author    Json   @db.JsonB  // Required
}
```

### Arrays of Typed JSON

```prisma
model Dashboard {
  id Int @id
  
  /// [Widget]
  widgets Json[]  // Each element is typed as Widget
}
```

```ts
declare global {
  namespace PrismaJson {
    type Widget = {
      id: string;
      type: 'chart' | 'table' | 'metric';
      position: { x: number; y: number };
      config: Record<string, unknown>;
    };
  }
}
```

## Advanced Features

### Inline Type Definitions

For simple types, define them directly in the schema using `![type]`:

```prisma
model Settings {
  id Int @id
  
  /// ![{ theme: 'dark' | 'light', language: string }]
  preferences Json
  
  /// ![number[]]
  allowedIds  Json
}
```

### Global Type Mapping with `useType`

Use a single TypeScript interface to type multiple fields dynamically:

```prisma
generator json {
  provider = "prisma-json-types-generator"
  useType  = "FieldTypes"  // References PrismaJson.FieldTypes
}

model Form {
  /// [email]     // Becomes PrismaJson.FieldTypes['email']
  emailField Json
  
  /// [phone]     // Becomes PrismaJson.FieldTypes['phone']  
  phoneField Json
}
```

```ts
declare global {
  namespace PrismaJson {
    // Single interface for all field types
    interface FieldTypes {
      email: { value: string; verified: boolean };
      phone: { countryCode: string; number: string };
      [key: string]: any; // Required index signature
    }
  }
}
```

### Database-Specific Considerations

Different databases have varying JSON support:

| Database | JSON Fields | JSON Arrays | Notes |
|----------|------------|-------------|-------|
| PostgreSQL | ✅ Full | ✅ Full | Complete JSON/JSONB support |
| MySQL | ✅ Full | ❌ No | Use `String[]` with manual parse/stringify |
| MongoDB | ✅ Full | ✅ Full | Supports composite types too |
| SQLite | ❌ No | ❌ No | Use typed `String` fields |
| SQL Server | ❌ No | ❌ No | Use typed `String` fields |
| CockroachDB | ✅ Full | ❌ No | Similar to MySQL limitations |

Example for databases without JSON support:

```prisma
// For SQLite or SQL Server
model User {
  id Int @id
  
  /// [UserData]
  data String  // Store JSON.stringify(userData)
}
```

### Working with Composite Types (MongoDB)

```prisma
type Address {
  /// [GeoCoordinates]
  coordinates Json
  
  street  String
  city    String
}

model User {
  id      String  @id @map("_id") @db.ObjectId
  address Address
}
```

## Configuration Options

```prisma
generator json {
  provider     = "prisma-json-types-generator"
  namespace    = "PrismaJson"      // Default: "PrismaJson"
  clientOutput = "path/to/client"   // Default: Auto-detected
  allowAny     = false              // Default: false (uses 'unknown')
  useType      = "MyType"           // Default: undefined
}
```

| Option | Description |
|--------|-------------|
| `namespace` | TypeScript namespace for your types |
| `clientOutput` | Custom path to generated Prisma Client |
| `allowAny` | Use `any` instead of `unknown` for untyped fields |
| `useType` | Interface name for dynamic field type mapping |

## Integration with Runtime Validation

Combine with Zod or similar libraries for runtime + compile-time safety:

```ts
import { z } from 'zod';

// 1. Define schema (source of truth)
export const UserProfileSchema = z.object({
  theme: z.enum(['dark', 'light']),
  bio: z.string().optional()
});

// 2. Expose type to Prisma
declare global {
  namespace PrismaJson {
    type UserProfile = z.infer<typeof UserProfileSchema>;
  }
}

// 3. Validate at runtime
async function updateProfile(userId: number, data: unknown) {
  const profile = UserProfileSchema.parse(data); // Runtime validation
  
  return prisma.user.update({
    where: { id: userId },
    data: { profile } // Compile-time type safety
  });
}
```

## Tips & Best Practices

### 1. Organize Your Types

Keep your JSON types in a dedicated file:

```ts
// types/prisma-json.d.ts
export {};

declare global {
  namespace PrismaJson {
    // Group related types together
    
    // User-related types
    type UserProfile = { ... };
    type UserSettings = { ... };
    
    // Product-related types
    type ProductMeta = { ... };
    type PricingInfo = { ... };
  }
}
```

### 2. Use Literal Types for Status Fields

Instead of database enums, use literal types:

```prisma
/// !['draft' | 'published' | 'archived']
status String @default("draft")
```

### 3. Handle Array Operations

The generator supports Prisma's array update operations:

```ts
// For Json[] fields
await prisma.model.update({
  where: { id: 1 },
  data: {
    jsonArray: {
      push: newItem,    // Add item(s)
      set: [item1, item2] // Replace array
    }
  }
});
```

### 4. Remember Type-Only Transform

This generator only affects TypeScript types - no runtime changes:

- ✅ Type checking at compile time
- ✅ IDE autocomplete and IntelliSense  
- ❌ Runtime validation (use Zod/Yup/etc.)
- ❌ Automatic JSON schema validation

## Troubleshooting

### Types Not Applied?

1. Ensure comment syntax is exact: `/// [TypeName]` (three slashes, space, brackets)
2. Run `npx prisma generate` after changes
3. Restart TypeScript server in your IDE
4. Check that your types file is included in `tsconfig.json`

### Multi-file Client Issues

For Prisma 6.7+ with multi-file output, the generator handles the new structure automatically. If you have issues, try specifying `clientOutput` explicitly.

### Version Compatibility

- Requires Prisma v5.0+ (generator v3)
- Tested with latest Prisma versions
- Check warnings during generation for compatibility notices

## How It Works

1. **Parse**: Reads your Prisma schema and finds type annotations in comments
2. **Transform**: Modifies the generated Prisma Client TypeScript declarations
3. **Replace**: Swaps `JsonValue` and `string` types with your custom types
4. **Preserve**: Maintains all Prisma functionality while adding type safety

The transformation happens at generation time with zero runtime overhead.

## Contributing

Found a bug or have a feature request? [Open an issue](https://github.com/arthurfiorette/prisma-json-types-generator/issues)!

## License

MIT © [Arthur Fiorette](https://github.com/arthurfiorette)

---

<p align="center">
  <b>Using this package?</b> Please consider <a href="https://github.com/sponsors/arthurfiorette" target="_blank">sponsoring</a> to support development! ❤️
</p>