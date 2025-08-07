# Suggested Commands for Development

## Package Management (pnpm)
```bash
# Install dependencies
pnpm install

# Install with frozen lockfile (CI/production)
pnpm install --frozen-lockfile

# Add new dependency
pnpm add <package>
pnpm add -D <package>  # Dev dependency

# Update dependencies
pnpm update

# Check outdated packages
pnpm outdated
```

## Development Commands
```bash
# Build TypeScript to JavaScript
pnpm build

# Watch mode for development
pnpm dev

# Start the compiled generator
pnpm start
```

## Code Quality
```bash
# Run Biome linter
pnpm lint

# Run Biome CI check (stricter, used in CI)
pnpm lint-ci

# Auto-fix linting and formatting issues
pnpm lint-fix

# Format code only
pnpm format
```

## Testing
```bash
# Run all tests
pnpm test

# Run specific test schema
sh ./scripts/test.sh normal
sh ./scripts/test.sh mysql
sh ./scripts/test.sh mongo

# Run tests sequentially (if parallel fails)
PJTG_SEQUENTIAL_TESTS=1 pnpm test

# Test type definitions only (after generation)
pnpm tsd -f test/types/normal.test-d.ts -t . --show-diff
```

## Prisma Commands
```bash
# Generate Prisma client with test schema
pnpm prisma generate --schema test/schemas/normal.prisma

# Format Prisma schema
pnpm prisma format --schema test/schemas/normal.prisma
```

## Git Commands
```bash
# Check git status
git status

# Stage changes
git add .
git add <file>

# Commit with message
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue"
git commit -m "docs: update documentation"

# Push changes
git push origin main
git push origin <branch>

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main
git checkout <branch>
```

## System Commands (Linux)
```bash
# List files
ls -la

# Change directory
cd src/
cd ..

# Search for files
find . -name "*.ts"
find test/ -name "*.prisma"

# Search in files (ripgrep preferred)
rg "JsonValue" --type ts
rg "generator" test/schemas/

# View file content
cat package.json
head -n 20 src/generator.ts
tail -n 50 src/on-generate.ts

# Create directory
mkdir -p src/new-feature

# Remove files (careful!)
rm -f dist/*.js
rm -rf test/target/

# Check Node version
node --version

# Check pnpm version
pnpm --version
```

## NPM Registry
```bash
# View package info
npm view prisma-json-types-generator

# Publish new version (maintainers only)
npm publish

# Create tarball for testing
npm pack
```

## Environment Variables
```bash
# Run tests sequentially
PJTG_SEQUENTIAL_TESTS=1 pnpm test

# Debug Prisma generation
DEBUG=* pnpm prisma generate --schema test/schemas/normal.prisma
```

## Quick Development Workflow
```bash
# 1. Make changes to source code
# 2. Build and verify
pnpm build && pnpm lint

# 3. Test changes
pnpm test

# 4. Fix any issues
pnpm lint-fix

# 5. Commit changes
git add . && git commit -m "feat: description"
```