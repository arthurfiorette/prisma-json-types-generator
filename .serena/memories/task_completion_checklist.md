# Task Completion Checklist

When completing any development task in this project, follow these steps:

## 1. Build the Project
```bash
pnpm build
```
Ensure TypeScript compilation succeeds without errors.

## 2. Run Linting and Formatting
```bash
# Check for linting issues
pnpm lint

# Auto-fix linting and formatting issues
pnpm lint-fix

# Format code only
pnpm format
```

## 3. Run Tests
```bash
# Run all tests (generates Prisma clients and runs type tests)
pnpm test

# Run specific test schema
sh ./scripts/test.sh <schema-name>
# Example: sh ./scripts/test.sh normal

# For sequential test execution (if parallel tests fail)
PJTG_SEQUENTIAL_TESTS=1 pnpm test
```

## 4. Verify Type Definitions
- Check that generated type definitions in `dist/` are correct
- Verify that test types in `test/types/*.test-d.ts` pass

## 5. Pre-commit Checks
Husky will automatically run pre-commit hooks. Manual verification:
```bash
# Biome CI check (same as GitHub Actions)
pnpm lint-ci
```

## 6. Test with Different Databases
If changes affect type generation logic, test with multiple database schemas:
- PostgreSQL: `test/schemas/normal.prisma`
- MySQL: `test/schemas/mysql.prisma`
- MongoDB: `test/schemas/mongo.prisma`
- SQLite: `test/schemas/sqlite.prisma`
- SQL Server: `test/schemas/mssql.prisma`
- CockroachDB: `test/schemas/cockroach.prisma`

## 7. Version Compatibility
Ensure changes work with:
- Prisma v5.x and v6.x
- Both single-file (`index.d.ts`) and multi-file (`models/`) client structures

## Common Issues to Check
- [ ] No TypeScript compilation errors
- [ ] All tests pass
- [ ] Code is properly formatted (Biome)
- [ ] No unused imports or variables
- [ ] Type annotations are explicit (no implicit any)
- [ ] Error messages provide context
- [ ] Changes work with strict TypeScript settings