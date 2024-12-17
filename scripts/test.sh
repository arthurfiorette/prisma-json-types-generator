#/bin/sh

# Gets all files in test/schemas (Probably there's a better way to do this)
if [ "$#" -eq 0 ]; then
  FILES=$(ls -l test/schemas | awk '{print $9}' | awk -F '.' '{print $1}')
else
  FILES="$@"
fi

# Generates each prisma schema
for file in $FILES; do
  if [ "$file" = "typedsql" ]; then
    pnpm prisma migrate dev --schema test/schemas/$file.prisma --name init --skip-generate --skip-seed
  fi

  if [ "$#" -eq 0 ]; then
    pnpm prisma generate --schema test/schemas/$file.prisma --sql > /dev/null &
  else
    pnpm prisma generate --schema test/schemas/$file.prisma --sql
  fi
done

# Waits for generation
wait

# Runs tests sequentially
for file in $FILES; do
  pnpm tsd -f test/types/$file.test-d.ts -t . --show-diff && echo "✅ $file"
done
