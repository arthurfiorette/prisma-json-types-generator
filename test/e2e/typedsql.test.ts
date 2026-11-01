import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import {
  changedFiles,
  describeEdits,
  generateTwice,
  RAW,
  root,
  runPrisma,
  runTsd,
  typecheckWithTs7
} from './helpers';

// TypedSQL needs a live postgres to introspect queries, start one with `docker compose up -d --wait`
const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://prisma:prisma@localhost:5432/typedsql'
};

const CONFIG = 'test/typedsql/prisma.config.ts';
const SCHEMA = path.join(root, 'test/typedsql/schema.prisma');

// Files our generator wrote to, type checked with TypeScript 7 at the end
const edited: string[] = [];

test('typedsql', (t) => {
  runPrisma(['db', 'push', '--force-reset', '--config', CONFIG], env);

  const { messages, before, after } = generateTwice(SCHEMA, ['--sql', '--config', CONFIG], env);

  edited.push(...changedFiles(before, after));

  assert.deepEqual(messages, []);
  t.assert.snapshot(describeEdits(before, after), RAW);
});

test('type assertions (tsd)', async () => {
  const errors = await runTsd(['test/types/typedsql.test-d.ts']);
  if (errors) assert.fail(errors);
});

test('generated output type checks with TypeScript 7', () => {
  const errors = typecheckWithTs7('test/e2e/tsconfig.typedsql.json', edited);
  if (errors) assert.fail(errors);
});
