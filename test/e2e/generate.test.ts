import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import {
  changedFiles,
  describeEdits,
  generateTwice,
  generatorMessages,
  RAW,
  readGenerators,
  readTree,
  removeDirs,
  root,
  runPrisma,
  runTsd,
  typecheckWithTs7
} from './helpers';

const SCHEMAS_DIR = path.join(root, 'test/schemas');
const schemas = fs
  .readdirSync(SCHEMAS_DIR)
  .filter((file) => file.endsWith('.prisma'))
  .sort();

const outputsOf = (schemaPath: string) =>
  readGenerators(schemaPath).flatMap((g) => (!g.ours && g.output ? [g.output] : []));

// Files our generator wrote to, type checked with TypeScript 7 at the end
const edited = new Set<string>();

// Keep every test sequential: Prisma breaks when generating in parallel
describe('schemas', () => {
  for (const file of schemas) {
    test(file, (t) => {
      const { messages, before, after } = generateTwice(path.join(SCHEMAS_DIR, file), [
        '--schema',
        `test/schemas/${file}`
      ]);

      for (const changed of changedFiles(before, after)) {
        edited.add(changed);
      }

      assert.deepEqual(messages, []);
      t.assert.snapshot(describeEdits(before, after), RAW);
    });
  }
});

test('reports generator errors', () => {
  const result = runPrisma(['generate', '--schema', 'test/e2e/fixtures/error.prisma']);

  assert.ok(
    generatorMessages(result).some((line) =>
      line.includes('Found unsupported required field type')
    ),
    'the generator error was not visible, generator errors cannot be detected'
  );
});

describe('large schema', () => {
  const MODELS = 300;
  const dir = path.join(root, 'test/target/large');

  for (const [name, provider] of [
    ['js', 'prisma-client-js'],
    ['new', 'prisma-client']
  ] as const) {
    test(`${MODELS} models with ${provider}`, (t) => {
      const schemaPath = path.join(dir, `${name}.prisma`);
      writeLargeSchema(schemaPath, provider, MODELS);
      removeDirs(outputsOf(schemaPath));

      const result = runPrisma(['generate', '--schema', path.relative(root, schemaPath)]);

      // Counts only: the small schemas already snapshot every edit
      const counts = new Map<string, number>();
      for (const [file, content] of readTree(outputsOf(schemaPath))) {
        const namespaced = content.split('BenchJson.').length - 1;
        const literals = content.split('(1 | 2)').length - 1;

        if (namespaced || literals) {
          const key = `${namespaced} BenchJson. and ${literals} (1 | 2)`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
          edited.add(file);
        }
      }

      assert.deepEqual(generatorMessages(result), []);
      t.assert.snapshot(
        [...counts].map(([key, files]) => `${files} files with ${key}`).join('\n'),
        RAW
      );
    });
  }
});

test('type assertions (tsd)', async () => {
  const errors = await runTsd(['test/types/*.test-d.ts', '!test/types/typedsql.test-d.ts']);
  if (errors) assert.fail(errors);
});

test('generated output type checks with TypeScript 7', () => {
  const errors = typecheckWithTs7('test/e2e/tsconfig.json', edited);
  if (errors) assert.fail(errors);
});

function writeLargeSchema(schemaPath: string, provider: string, models: number) {
  let body = '';

  for (let i = 0; i < models; i++) {
    body += `
model M${i} {
  id Int @id @default(autoincrement())
  /// [Data]
  data Json
  /// [Opt]
  opt Json?
  /// [List]
  list Json[]
  /// [Name]
  name String
  /// ![1 | 2]
  count Int
  other String?
${i > 0 ? `  parentId Int\n  parent M${i - 1} @relation(fields: [parentId], references: [id])\n` : ''}${i < models - 1 ? `  children M${i + 1}[]\n` : ''}}
`;
  }

  const output = `out-${path.basename(schemaPath, '.prisma')}`;

  fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
  fs.writeFileSync(
    schemaPath,
    `generator client {
  provider = "${provider}"
  output   = "./${output}"
}

generator json {
  provider  = "node ./index.js"
  namespace = "BenchJson"
}

datasource db {
  provider = "postgresql"
}
${body}`
  );
}
