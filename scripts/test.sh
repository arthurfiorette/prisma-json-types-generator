#/bin/sh

# Gets all files in test/schemas
FILES=$(ls -l ./test/schemas | awk '{print $9}')

for file in $FILES
do
  # Runs prisma generate hiding stdout
  pnpm prisma generate --schema ./test/schemas/$file &
done

# Waits for all generations to finish
wait

# Runs test
pnpm tsd -t ./test/types -f ./test/types/**.test-d.ts