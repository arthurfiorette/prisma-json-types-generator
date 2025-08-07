# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: All strict type-checking options enabled
- **Target**: ES2020
- **Module System**: CommonJS
- **Important Flags**:
  - `noImplicitAny`: true
  - `strictNullChecks`: true
  - `noUnusedLocals`: true
  - `noUnusedParameters`: true
  - `noUncheckedIndexedAccess`: true
  - `isolatedModules`: true (for safe transpilation)

## Code Formatting and Linting
- **Tool**: Biome (extends `@arthurfiorette/biomejs-config`)
- **Line Endings**: LF (enforced via git config)
- **Indentation**: 2 spaces (inferred from existing code)
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use semicolons
- **Trailing Commas**: ES5 style

## Naming Conventions
- **Files**: Kebab-case (e.g., `model-payload.ts`, `type-parser.ts`)
- **Classes**: PascalCase (e.g., `GeneratorError`)
- **Functions**: camelCase (e.g., `getDmmfDocument`, `parseFieldType`)
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase for config objects
- **Interfaces/Types**: PascalCase (e.g., `Config`, `TypeData`)

## Code Organization
- **Entry Points**: `generator.ts`, `index.js`
- **Handlers**: Process TypeScript AST nodes (`handler/` directory)
- **Helpers**: Parse and process data (`helpers/` directory)
- **Utilities**: Common functionality (`util/` directory)
- **Assets**: Template files (`assets/` directory)

## Documentation Standards
- Use JSDoc comments for exported functions and complex logic
- Inline comments for non-obvious code sections
- Type annotations always explicit (no implicit any)
- Prefer self-documenting code over excessive comments

## Error Handling
- Custom `GeneratorError` class for domain-specific errors
- Always provide context in error messages
- Graceful degradation where possible

## Testing Approach
- Type testing with TSD library
- Test schemas in `test/schemas/` directory
- Type definition tests in `test/types/` directory
- Each database provider tested separately

## Import Style
- Use named imports for external packages
- Group imports: Node built-ins, external packages, internal modules
- Absolute imports from package root
- Avoid circular dependencies