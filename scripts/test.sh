#/bin/sh

# Gets all files in test/schemas (Probably there's a better way to do this)
FILES=$(ls -l test/schemas | awk '{print $9}' | awk -F '.' '{print $1}')

# Generates each prisma schema
for file in $FILES; do
  pnpm prisma generate --schema test/schemas/$file.prisma > /dev/null &
done

# Waits for generation
wait

# Runs tests sequentially
for file in $FILES; do
  pnpm tsd -f test/types/$file.test-d.ts -t . --show-diff && echo "✅ $file"
done
