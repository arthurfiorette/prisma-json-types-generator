import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import ts from 'typescript';
import { handleTypedSqlFile } from '../../src/handler/typedsql';
import type { PrismaJsonTypesGeneratorConfig } from '../../src/util/config';
import type { TextDiff } from '../../src/util/text-changes';
import { applyTextChanges } from '../../src/util/text-changes';

/** Minimal config used for tests */
const config: PrismaJsonTypesGeneratorConfig = {
  namespace: 'PTypedSqlJson',
  allowAny: false,
  useType: undefined,
  clientOutput: undefined
};

/** Minimal config with allowAny=true */
const configAllowAny: PrismaJsonTypesGeneratorConfig = {
  ...config,
  allowAny: true
};

/** A simple mock writer that records replace() calls */
class MockWriter {
  public changes: TextDiff[] = [];
  public readonly multifile = true;

  replace(start: number, end: number, text: string) {
    this.changes.push({ start, end, text });
  }
}

/**
 * Helper: parse a TypedSQL-formatted TypeScript source string, run the handler,
 * apply the recorded replacements and return the resulting source text.
 */
function processTypedSqlSource(
  source: string,
  queryName: string,
  resultColumns: Array<{ name: string; typ: string; nullable: boolean }>,
  columnDocs: Map<string, string | undefined>,
  cfg: PrismaJsonTypesGeneratorConfig = config
): string {
  const tsSource = ts.createSourceFile(
    `${queryName}.ts`,
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );

  const writer = new MockWriter();

  handleTypedSqlFile(
    tsSource,
    writer as never,
    {
      name: queryName,
      source: `SELECT * FROM "${queryName}"`,
      documentation: null,
      parameters: [],
      resultColumns
    },
    columnDocs,
    cfg
  );

  return applyTextChanges(source, writer.changes);
}

describe('handleTypedSqlFile - TypedSQL JSON type replacement', () => {
  const sampleSource = `import * as $runtime from "../runtime/client";

export declare const asdd: () => $runtime.TypedSql<asdd.Parameters, asdd.Result>;

export namespace asdd {
  export type Parameters = [];
  export type Result = {
    id: number
    field: $runtime.JsonValue
    optField: $runtime.JsonValue | null
  }
}
`;

  test('replaces non-nullable json column with literal type', () => {
    const columnDocs = new Map([
      ['field', '![number]'],
      ['optField', '![string]']
    ]);

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [
        { name: 'id', typ: 'int', nullable: false },
        { name: 'field', typ: 'json', nullable: false },
        { name: 'optField', typ: 'json', nullable: true }
      ],
      columnDocs
    );

    assert(result.includes('field: (number)'), `Expected 'field: (number)' in:\n${result}`);
    assert(
      result.includes('optField: (string) | null'),
      `Expected 'optField: (string) | null' in:\n${result}`
    );
    // Non-json columns must not be touched
    assert(result.includes('id: number'), `Expected 'id: number' in:\n${result}`);
  });

  test('replaces json column with namespace type', () => {
    const columnDocs = new Map([['field', '[MyJsonType]']]);

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [{ name: 'field', typ: 'json', nullable: false }],
      columnDocs
    );

    assert(
      result.includes('field: PTypedSqlJson.MyJsonType'),
      `Expected namespace type in:\n${result}`
    );
  });

  test('appends | null for nullable json columns', () => {
    const columnDocs = new Map([['optField', '[Opt]']]);

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [{ name: 'optField', typ: 'json', nullable: true }],
      columnDocs
    );

    assert(
      result.includes('optField: PTypedSqlJson.Opt | null'),
      `Expected nullable type in:\n${result}`
    );
  });

  test('handles json-array column type', () => {
    const source = `import * as $runtime from "../runtime/client";
export namespace q {
  export type Parameters = [];
  export type Result = {
    tags: $runtime.JsonValue[]
  }
}
`;
    const columnDocs = new Map([['tags', '![string]']]);

    const result = processTypedSqlSource(
      source,
      'q',
      [{ name: 'tags', typ: 'json-array', nullable: false }],
      columnDocs
    );

    assert(result.includes('tags: (string)[]'), `Expected array type in:\n${result}`);
  });

  test('skips unannotated json columns when allowAny=true', () => {
    const columnDocs = new Map<string, string | undefined>(); // empty

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [
        { name: 'field', typ: 'json', nullable: false },
        { name: 'optField', typ: 'json', nullable: true }
      ],
      columnDocs,
      configAllowAny
    );

    // With allowAny=true and no annotations, types should remain unchanged
    assert(result.includes('field: $runtime.JsonValue'), `Expected unchanged type in:\n${result}`);
  });

  test('replaces unannotated json columns with unknown when allowAny=false', () => {
    const columnDocs = new Map<string, string | undefined>(); // empty

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [{ name: 'field', typ: 'json', nullable: false }],
      columnDocs
    );

    assert(result.includes('field: unknown'), `Expected 'field: unknown' in:\n${result}`);
  });

  test('ignores non-json columns even if they appear in the annotation map', () => {
    const columnDocs = new Map([['id', '![number]']]);

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [
        // id is int, not json
        { name: 'id', typ: 'int', nullable: false }
      ],
      columnDocs
    );

    // 'id' should remain 'number' — handler should not touch non-json columns
    assert(result.includes('id: number'), `Expected id:number untouched in:\n${result}`);
  });

  test('does nothing when query has no json columns', () => {
    const columnDocs = new Map([['field', '![number]']]);
    const source = `export namespace noJson {
  export type Parameters = [];
  export type Result = {
    id: number
    name: string
  }
}
`;

    const result = processTypedSqlSource(
      source,
      'noJson',
      [
        { name: 'id', typ: 'int', nullable: false },
        { name: 'name', typ: 'string', nullable: false }
      ],
      columnDocs
    );

    assert.equal(result, source);
  });

  test('does nothing when query name does not match namespace', () => {
    const columnDocs = new Map([['field', '![number]']]);

    // processTypedSqlSource uses 'wrong' as query name, but namespace is 'asdd'
    const result = processTypedSqlSource(
      sampleSource,
      'wrong',
      [{ name: 'field', typ: 'json', nullable: false }],
      columnDocs
    );

    assert.equal(result, sampleSource);
  });
});

describe('columnDocs lookup — json-typed columns with @map and collisions', () => {
  /** Helper replicating the inline build from on-generate.ts */
  function buildColumnDocs(
    models: Array<{
      fields: Array<{
        name: string;
        type: string;
        dbName: string | null;
        documentation: string | undefined;
      }>;
    }>
  ): Map<string, string | undefined> {
    const columnDocs = new Map<string, string | undefined>();
    for (const model of models) {
      for (const field of model.fields) {
        if (field.type !== 'Json') continue;
        const col = field.dbName ?? field.name;
        if (!columnDocs.has(col)) columnDocs.set(col, field.documentation);
      }
    }
    return columnDocs;
  }

  test('maps field name to documentation for Json fields', () => {
    const map = buildColumnDocs([
      {
        fields: [
          { name: 'id', type: 'Int', dbName: null, documentation: undefined },
          { name: 'data', type: 'Json', dbName: null, documentation: '![number]' }
        ]
      }
    ]);

    assert(!map.has('id'), 'Should not include non-Json fields');
    assert(map.has('data'), 'Should include Json fields');
    assert.equal(map.get('data'), '![number]');
  });

  test('uses dbName (@map) as the key when set', () => {
    const map = buildColumnDocs([
      {
        fields: [{ name: 'myField', type: 'Json', dbName: 'my_field', documentation: '[T]' }]
      }
    ]);

    assert(map.has('my_field'), 'Should use dbName as key');
    assert(!map.has('myField'), 'Should not use field name when dbName is set');
    assert.equal(map.get('my_field'), '[T]');
  });

  test('first model wins when the same column name appears in multiple models', () => {
    const map = buildColumnDocs([
      { fields: [{ name: 'data', type: 'Json', dbName: null, documentation: '[TypeA]' }] },
      { fields: [{ name: 'data', type: 'Json', dbName: null, documentation: '[TypeB]' }] }
    ]);

    assert.equal(map.get('data'), '[TypeA]', 'First model should win');
  });

  test('sets undefined documentation for unannotated Json fields', () => {
    const map = buildColumnDocs([
      { fields: [{ name: 'raw', type: 'Json', dbName: null, documentation: undefined }] }
    ]);

    assert(map.has('raw'), 'Should include field even without documentation');
    assert.equal(map.get('raw'), undefined);
  });
});
