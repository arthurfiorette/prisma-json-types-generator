import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import tsd, { formatter } from 'tsd';

export const root = path.resolve(__dirname, '../..');

const PRISMA_CLI = require.resolve('prisma/build/index.js');

/** Repository relative path with forward slashes, so snapshots match on Windows. */
export const relative = (file: string) => path.relative(root, file).split(path.sep).join('/');

export interface PrismaResult {
  stdout: string;
  stderr: string;
}

/**
 * Runs the prisma CLI from the repository root, where every test schema's
 * `provider = "node ./index.js"` resolves to the built generator.
 */
export function runPrisma(args: string[], env: NodeJS.ProcessEnv = {}): PrismaResult {
  const { FORCE_COLOR: _, ...parentEnv } = process.env;

  // Only `generate` accepts `--no-hints`
  const hints = args[0] === 'generate' ? ['--no-hints'] : [];

  const result = spawnSync(process.execPath, [PRISMA_CLI, ...args, ...hints], {
    cwd: root,
    encoding: 'utf8',
    // Large schemas print a stack trace per failed field
    maxBuffer: 256 * 1024 * 1024,
    env: {
      ...parentEnv,
      // Prisma only forwards non JSON-RPC stderr lines of generators, like our
      // console.error calls, through this debug namespace
      DEBUG: 'prisma:GeneratorProcess',
      // node --test forces colors in a TTY, which wraps the namespace in ANSI codes
      DEBUG_COLORS: 'false',
      NO_COLOR: '1',
      CHECKPOINT_DISABLE: '1',
      PRISMA_HIDE_UPDATE_MESSAGE: '1',
      ...env
    }
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      `prisma ${args.join(' ')} failed (status ${result.status}, signal ${result.signal})\n${result.error ?? ''}\n${result.stdout}\n${result.stderr}`
    );
  }

  return { stdout: result.stdout, stderr: result.stderr };
}

/** Anything our generator printed: errors through stderr and `warn()` through stdout. */
export function generatorMessages({ stdout, stderr }: PrismaResult) {
  const lines = stripVTControlCharacters(`${stdout}\n${stderr}`).split(/\r?\n/);

  return lines.filter(
    (line) =>
      (line.includes('prisma:GeneratorProcess') && !line.includes('child exited with')) ||
      line.includes('prisma-json-types-generator:')
  );
}

export interface SchemaGenerator {
  name: string;
  output: string | undefined;
  ours: boolean;
}

/** Reads the generator blocks of a schema, outputs resolved against the schema directory. */
export function readGenerators(schemaPath: string): SchemaGenerator[] {
  const content = fs.readFileSync(schemaPath, 'utf8');

  return [...content.matchAll(/^generator\s+(\w+)\s*\{([^}]*)\}/gm)].map(([, name, body]) => {
    const output = body!.match(/^\s*output\s*=\s*"([^"]+)"/m)?.[1];

    return {
      name: name!,
      output: output ? path.resolve(path.dirname(schemaPath), output) : undefined,
      ours: /provider\s*=\s*"node \.\/index\.js"/.test(body!)
    };
  });
}

export type Tree = Map<string, string>;

/** Every TypeScript file below the given directories, keyed by repository relative path. */
export function readTree(dirs: string[]): Tree {
  const tree: Tree = new Map();

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) {
      return;
    }

    for (const entry of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const file = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(file);
      } else if (/\.[cm]?ts$/.test(entry.name)) {
        tree.set(relative(file), fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
      }
    }
  };

  for (const dir of dirs) {
    walk(dir);
  }

  return tree;
}

export function removeDirs(dirs: string[]) {
  for (const dir of dirs) {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  }
}

export interface Generation {
  messages: string[];
  before: Tree;
  after: Tree;
}

/**
 * Generates a schema twice: first with only the prisma clients to capture their untouched
 * output, then with every generator. Prisma does not pass unselected generators to ours,
 * so running ours alone on top of the first output is not possible.
 */
export function generateTwice(schemaPath: string, extraArgs: string[] = [], env = {}): Generation {
  const generators = readGenerators(schemaPath);
  const outputs = generators.flatMap((g) => (!g.ours && g.output ? [g.output] : []));
  const clients = generators.filter((g) => !g.ours).flatMap((g) => ['--generator', g.name]);

  removeDirs(outputs);
  runPrisma(['generate', ...extraArgs, ...clients], env);
  const before = readTree(outputs);

  const result = runPrisma(['generate', ...extraArgs], env);

  return { messages: generatorMessages(result), before, after: readTree(outputs) };
}

const DECLARATION =
  /^\s*(?:export\s+)?(?:declare\s+)?(?:type|interface|namespace|const|function|class)\s+([\w$]+)/;

/** Name of the nearest declaration starting at or above the given line. */
function enclosingName(lines: string[], index: number) {
  for (let i = index; i >= 0; i--) {
    const name = lines[i]!.match(DECLARATION)?.[1];

    if (name) {
      return name;
    }
  }

  return '(top level)';
}

const FIRST_TOKEN = /^\s*[^\s:?(]+/;

/**
 * Describes what our generator changed, one line per edit, independent of line numbers so
 * unrelated changes in prisma's output do not show up.
 *
 * The generator only replaces type spans within a line and inserts one block of header lines
 * before the first edit, so lines can be aligned 1:1 after that block. Throws when that does
 * not hold, since the description would be wrong.
 */
export function describeEdits(before: Tree, after: Tree) {
  const out: string[] = [];

  for (const file of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    const a = before.get(file);
    const b = after.get(file);

    if (a === b) {
      continue;
    }

    if (a === undefined) {
      const imports = b!.split('\n').filter((line) => line.startsWith('import '));
      out.push(`${file} | created`, ...imports.map((line) => `${file} | + ${line}`));
      continue;
    }

    if (b === undefined) {
      out.push(`${file} | deleted`);
      continue;
    }

    const aLines = a.split('\n');
    const bLines = b.split('\n');
    const inserted = bLines.length - aLines.length;

    let start = 0;
    while (start < aLines.length && aLines[start] === bLines[start]) {
      start++;
    }

    if (inserted < 0) {
      throw new Error(`${file}: generator removed ${-inserted} lines`);
    }

    for (const line of bLines.slice(start, start + inserted)) {
      if (line.trim()) {
        out.push(`${file} | + ${line.trim()}`);
      }
    }

    for (let i = start; i < aLines.length; i++) {
      const oldLine = aLines[i]!;
      const newLine = bLines[i + inserted]!;

      if (oldLine === newLine) {
        continue;
      }

      if (oldLine.match(FIRST_TOKEN)?.[0] !== newLine.match(FIRST_TOKEN)?.[0]) {
        throw new Error(
          `${file}:${i + 1}: lines are no longer aligned, did an edit add or remove lines?\n- ${oldLine}\n+ ${newLine}`
        );
      }

      out.push(`${file} | ${enclosingName(aLines, i)} | ${oldLine.trim()} => ${newLine.trim()}`);
    }
  }

  return out.join('\n');
}

/** Writes snapshots as plain text instead of JSON with escaped quotes. */
export const RAW = { serializers: [(value: unknown) => String(value)] };

export function changedFiles(before: Tree, after: Tree) {
  return [...after].flatMap(([file, content]) => (before.get(file) !== content ? [file] : []));
}

/**
 * Prisma marks every `prisma-client` file with `@ts-nocheck`, which turns broken references
 * into silent `any`s. Removing it from the files we changed lets the compiler check our
 * edits. Prisma's own files keep it because some of them do not type check (mongo).
 */
function removeTsNocheck(files: Iterable<string>) {
  for (const file of files) {
    const filepath = path.join(root, file);
    const content = fs.readFileSync(filepath, 'utf8');

    if (content.includes('@ts-nocheck')) {
      fs.writeFileSync(filepath, content.replace(/^\/\/ @ts-nocheck.*$/m, ''));
    }
  }
}

/** Runs tsd once over all given test files, returns the formatted errors when there are any. */
export async function runTsd(testFiles: string[]) {
  const diagnostics = await tsd({ cwd: root, typingsFile: '.', testFiles });
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');

  return errors.length ? formatter(errors, true) : undefined;
}

/**
 * Type checks a project plus the files our generator edited with the TypeScript 7 compiler,
 * returns its output when it fails. Edited files are added explicitly because the test files
 * do not import all of them.
 */
export function typecheckWithTs7(tsconfig: string, edited: Iterable<string>) {
  removeTsNocheck(edited);

  const project = path.join(root, 'test/target', `ts7.${path.basename(tsconfig)}`);
  fs.writeFileSync(
    project,
    JSON.stringify({
      extends: path.relative(path.dirname(project), path.join(root, tsconfig)),
      files: [...edited].map((file) => path.join(root, file))
    })
  );

  const pkg = require.resolve('typescript/package.json');
  const tsc = path.join(path.dirname(pkg), require(pkg).bin.tsc);
  const result = spawnSync(process.execPath, [tsc, '-p', project], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });

  return result.status === 0 ? undefined : `${result.error ?? ''}${result.stdout}${result.stderr}`;
}
