#!/bin/sh

# TypedSQL needs a live postgres to introspect queries, start one with `docker compose up -d --wait`
set -eu

export DATABASE_URL="${DATABASE_URL:-postgresql://prisma:prisma@localhost:5432/typedsql}"

CONFIG=test/typedsql/prisma.config.ts

pnpm prisma db push --force-reset --config "$CONFIG"
pnpm prisma generate --sql --config "$CONFIG"
pnpm tsd -f test/types/typedsql.test-d.ts -t . --show-diff

echo "✅ typedsql"
