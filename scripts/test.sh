#!/bin/sh

# Fail early on syntax errors or unset variables
set -eu

# Create a temp file to track exit codes
TMP_EXIT_FILE=$(mktemp)
trap 'rm -f "$TMP_EXIT_FILE"' EXIT

# Function to test a single file
test_file() {
  name="$1"
  if pnpm prisma generate --schema "test/schemas/$name.prisma" >/dev/null &&
     pnpm tsd -f "test/types/$name.test-d.ts" -t . --show-diff; then
    echo "✅ $name"
    echo "0" >> "$TMP_EXIT_FILE"
  else
    echo "1" >> "$TMP_EXIT_FILE"
  fi
}

# Get file names (without extension)
if [ "$#" -eq 0 ]; then
  FILES=$(find test/schemas -type f -name '*.prisma' | sed -E 's|test/schemas/(.*)\.prisma|\1|')
else
  FILES="$@"
fi

# Run tests (parallel by default, sequential if PJTG_SEQUENTIAL_TESTS=1)
if [ "${PJTG_SEQUENTIAL_TESTS:-0}" = "1" ]; then
  # Run tests sequentially
  for file in $FILES; do
    test_file "$file"
  done
else
  # Run all tests in parallel
  for file in $FILES; do
    test_file "$file" &
  done

  # Wait for all background jobs to finish
  wait
fi

# Check exit statuses
if grep -q "^1$" "$TMP_EXIT_FILE"; then
  exit 1
else
  exit 0
fi
