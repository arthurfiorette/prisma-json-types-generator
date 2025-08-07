# Prisma JSON Types Generator - Project Overview

## Purpose
Prisma JSON Types Generator is a Prisma generator that enhances type safety by transforming generic `JsonValue` and `string` types in Prisma Client into strongly-typed TypeScript interfaces. It parses special type annotations from Prisma schema comments and replaces the generated types with custom type definitions.

## Tech Stack
- **Language**: TypeScript (ES2020 target, CommonJS modules)
- **Runtime**: Node.js v20+ (minimum v14)
- **Package Manager**: pnpm v10.12.1
- **Key Dependencies**:
  - `@prisma/generator-helper` v6.13.0 - Prisma generator framework
  - `semver` v7.7.2 - Version compatibility checking
  - `tslib` v2.8.1 - TypeScript runtime helpers
- **Development Tools**:
  - Biome - Code formatting and linting
  - Husky - Git hooks
  - TSD - TypeScript type testing
  - Prisma v6.13.0 - For testing

## Project Type
This is a Prisma generator plugin that:
1. Reads Prisma schema files with custom type annotations
2. Modifies the generated Prisma Client TypeScript declarations
3. Replaces generic types with user-defined TypeScript types
4. Works at generation time with zero runtime overhead

## Key Features
- Strong typing for JSON fields in Prisma models
- String field typing for enum-like behavior
- Support for literal types and namespace-based types
- Database-agnostic (works with PostgreSQL, MySQL, MongoDB, SQLite, SQL Server, CockroachDB)
- Handles both single-file and multi-file Prisma client structures
- Configurable namespace and type handling options

## Version Compatibility
- Requires Prisma v5.0+ (generator v3)
- Supports Prisma v6.13.0 and multi-file client structure (v6.7+)
- TypeScript v5.8+ peer dependency