# Project Structure

## Root Directory
```
prisma-json-types-generator/
├── src/                    # TypeScript source code
├── dist/                   # Compiled JavaScript (generated)
├── test/                   # Test files and schemas
├── scripts/                # Utility scripts
├── assets/                 # Template files
├── images/                 # Documentation images
├── .github/                # GitHub Actions workflows
├── .husky/                 # Git hooks
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
├── biome.json             # Biome linter configuration
├── pnpm-lock.yaml         # Lock file
└── index.js               # Main entry point

## Source Code Structure (`src/`)
```
src/
├── generator.ts           # Main generator entry point
├── on-generate.ts         # Generation logic orchestrator
├── on-manifest.ts         # Generator metadata provider
├── handler/               # AST transformation handlers
│   ├── model-payload.ts   # Handles $ModelPayload types
│   ├── module.ts          # Processes Prisma namespace
│   ├── replace-object.ts  # Core type replacement engine
│   └── statement.ts       # TypeScript statement processor
├── helpers/               # Data processing utilities
│   ├── dmmf.ts           # DMMF document processor
│   ├── find-signature.ts  # Type signature matching
│   ├── regex.ts          # Regex pattern generation
│   └── type-parser.ts    # Annotation syntax parser
└── util/                  # Common utilities
    ├── config.ts          # Configuration types
    ├── constants.ts       # Project constants
    ├── create-signature.ts # Type signature creation
    ├── declaration-writer.ts # File I/O management
    ├── error.ts           # Custom error class
    ├── prisma-generator.ts # Prisma client finder
    └── source-path.ts     # Path resolution

## Test Structure (`test/`)
```
test/
├── schemas/               # Prisma schema test files
│   ├── normal.prisma     # Standard PostgreSQL test
│   ├── mysql.prisma      # MySQL-specific test
│   ├── mongo.prisma      # MongoDB with composites
│   ├── sqlite.prisma     # SQLite limitations test
│   ├── mssql.prisma      # SQL Server test
│   ├── cockroach.prisma  # CockroachDB test
│   ├── array.prisma      # JSON array tests
│   ├── string.prisma     # String field typing
│   ├── literal.prisma    # Literal type tests
│   ├── unknown.prisma    # Default behavior test
│   ├── any.prisma        # allowAny option test
│   ├── skip.prisma       # strictUndefinedChecks
│   └── use-type.prisma   # useType option test
├── types/                 # TypeScript type tests
│   └── *.test-d.ts       # TSD type definition tests
└── target/                # Generated Prisma clients (gitignored)
    └── <schema-name>/    # Client for each schema

## Key Files

### Entry Points
- `index.js` - Main package entry, requires the compiled generator
- `src/generator.ts` - Sets up Prisma generator handlers

### Core Logic
- `src/on-generate.ts` - Orchestrates the generation process
- `src/handler/replace-object.ts` - Core type replacement engine
- `src/helpers/dmmf.ts` - Processes Prisma's data model

### Configuration
- `package.json` - NPM package configuration
- `tsconfig.json` - TypeScript compiler settings
- `biome.json` - Code formatting and linting rules
- `.nvmrc` - Node.js version (v20)

### Testing
- `scripts/test.sh` - Test runner script
- `test/schemas/*.prisma` - Test schema files
- `test/types/*.test-d.ts` - Type definition tests

### CI/CD
- `.github/workflows/ci.yml` - GitHub Actions CI pipeline
- `.husky/` - Git hooks for pre-commit checks

## Generated Files (not in source control)
- `dist/` - Compiled JavaScript files
- `test/target/` - Generated Prisma clients for tests
- `*.tsbuildinfo` - TypeScript incremental build cache
- `node_modules/` - Installed dependencies