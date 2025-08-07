# Development Patterns and Guidelines

## Architecture Patterns

### AST Transformation Pipeline
The project follows a clear pipeline pattern for transforming TypeScript AST:
1. **Parse**: Read Prisma schema and extract type annotations
2. **Generate**: Let Prisma generate the client normally
3. **Transform**: Modify the generated TypeScript declarations
4. **Write**: Save the modified declarations back to disk

### Visitor Pattern
Used extensively for traversing TypeScript AST nodes:
- `handler/module.ts` visits module declarations
- `handler/statement.ts` visits type alias declarations
- `handler/replace-object.ts` visits and modifies property signatures

### Configuration Pattern
- Single configuration object passed through the pipeline
- Default values defined in `util/config.ts`
- User overrides from `schema.prisma` generator block

## Type Annotation Syntax
Two formats for type annotations in Prisma schema comments:

1. **Namespace Reference**: `/// [TypeName]`
   - References `PrismaJson.TypeName` from global namespace
   - Used for complex, reusable types

2. **Literal Type**: `/// ![TypeLiteral]`
   - Inline TypeScript type definition
   - Used for simple types or one-offs

## File Organization Patterns

### Separation of Concerns
- **Handlers**: AST node processing logic
- **Helpers**: Data extraction and parsing
- **Utils**: Shared functionality and types

### Single Responsibility
Each file has a clear, single purpose:
- `type-parser.ts` only parses type annotations
- `regex.ts` only generates regex patterns
- `declaration-writer.ts` only handles file I/O

## Error Handling Patterns

### Custom Error Class
```typescript
throw new GeneratorError('message', { data: context });
```

### Graceful Degradation
- If type annotation parsing fails, fall back to default type
- If signature matching fails, leave original type unchanged
- Always complete generation even with partial failures

## Testing Patterns

### Schema-Driven Testing
Each test case is a complete Prisma schema that tests specific features:
- Database-specific behavior
- Configuration options
- Type annotation variations

### Type-Level Testing
Using TSD to verify TypeScript types at compile time:
- `expectType<T>()` - Exact type match
- `expectAssignable<T>()` - Structural typing
- `expectNotAssignable<T>()` - Type incompatibility

## Code Generation Patterns

### Template-Based Generation
- `assets/namespace.d.ts` template for namespace declarations
- String interpolation for dynamic content

### Position Tracking
- Track text positions during modifications
- Adjust coordinates after each change
- Ensures accurate multi-edit operations

## Performance Patterns

### Lazy Processing
- Only process models with JSON or typed fields
- Skip "no-op" models without transformable fields

### Regex Caching
- Pre-compile regex patterns for model matching
- Store in maps for O(1) lookup

### Batch Operations
- Collect all modifications before writing
- Single file write operation per file

## Compatibility Patterns

### Version Detection
- Check Prisma version compatibility
- Detect client structure (single vs multi-file)
- Adapt generation strategy accordingly

### Progressive Enhancement
- Support new Prisma features when available
- Maintain backward compatibility
- Graceful fallback for unsupported features

## Common Anti-Patterns to Avoid

1. **Don't modify runtime code** - Only transform type definitions
2. **Don't parse TypeScript manually** - Use TypeScript Compiler API
3. **Don't assume file structure** - Detect and adapt
4. **Don't fail completely** - Degrade gracefully on errors
5. **Don't hardcode paths** - Use path resolution utilities

## Best Practices

1. **Type Safety First**: Always prefer `unknown` over `any`
2. **Explicit Types**: No implicit any, all parameters typed
3. **Pure Functions**: Prefer pure functions where possible
4. **Early Return**: Exit early on error conditions
5. **Descriptive Names**: Self-documenting code
6. **Small Functions**: Keep functions focused and testable
7. **Comments for Why**: Explain why, not what
8. **Test Edge Cases**: Cover database-specific quirks