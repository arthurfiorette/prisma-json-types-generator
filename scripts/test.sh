#/bin/sh

# Gets all files in test/schemas (Probably there's a better way to do this)
FILES=$(ls -l test/schemas | awk '{print $9}' | awk -F '.' '{print $1}')

for file in $FILES; do
  # Runs prisma generate hiding stdout
  pnpm prisma generate \
    --schema test/schemas/$file.prisma >/dev/null &&
    pnpm tsd \
      -f test/types/$file.test-d.ts \
      -t . \
      --show-diff &&
    echo "✅ $file" \
    &
done

# Waits for all tests to finish
wait
