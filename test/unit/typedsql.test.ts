import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import ts from 'typescript';
import { type ColumnAnnotationMap, handleTypedSqlFile } from '../../src/handler/typedsql';
import { buildTypedSqlColumnAnnotationMap } from '../../src/helpers/dmmf';
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
  columnAnnotationMap: ColumnAnnotationMap,
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
    columnAnnotationMap,
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
    const annotationMap: ColumnAnnotationMap = new Map([
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
      annotationMap
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
    const annotationMap: ColumnAnnotationMap = new Map([['field', '[MyJsonType]']]);

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [{ name: 'field', typ: 'json', nullable: false }],
      annotationMap
    );

    assert(
      result.includes('field: PTypedSqlJson.MyJsonType'),
      `Expected namespace type in:\n${result}`
    );
  });

  test('appends | null for nullable json columns', () => {
    const annotationMap: ColumnAnnotationMap = new Map([['optField', '[Opt]']]);

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [{ name: 'optField', typ: 'json', nullable: true }],
      annotationMap
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
    const annotationMap: ColumnAnnotationMap = new Map([['tags', '![string]']]);

    const result = processTypedSqlSource(
      source,
      'q',
      [{ name: 'tags', typ: 'json-array', nullable: false }],
      annotationMap
    );

    assert(result.includes('tags: (string)[]'), `Expected array type in:\n${result}`);
  });

  test('skips unannotated json columns when allowAny=true', () => {
    const annotationMap: ColumnAnnotationMap = new Map(); // empty

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [
        { name: 'field', typ: 'json', nullable: false },
        { name: 'optField', typ: 'json', nullable: true }
      ],
      annotationMap,
      configAllowAny
    );

    // With allowAny=true and no annotations, types should remain unchanged
    assert(result.includes('field: $runtime.JsonValue'), `Expected unchanged type in:\n${result}`);
  });

  test('replaces unannotated json columns with unknown when allowAny=false', () => {
    const annotationMap: ColumnAnnotationMap = new Map(); // empty

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [{ name: 'field', typ: 'json', nullable: false }],
      annotationMap
    );

    assert(result.includes('field: unknown'), `Expected 'field: unknown' in:\n${result}`);
  });

  test('ignores non-json columns even if they appear in the annotation map', () => {
    const annotationMap: ColumnAnnotationMap = new Map([['id', '![number]']]);

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [
        // id is int, not json
        { name: 'id', typ: 'int', nullable: false }
      ],
      annotationMap
    );

    // 'id' should remain 'number' — handler should not touch non-json columns
    assert(result.includes('id: number'), `Expected id:number untouched in:\n${result}`);
  });

  test('does nothing when query has no json columns', () => {
    const annotationMap: ColumnAnnotationMap = new Map([['field', '![number]']]);
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
      annotationMap
    );

    assert.equal(result, source);
  });

  test('does nothing when query name does not match namespace', () => {
    const annotationMap: ColumnAnnotationMap = new Map([['field', '![number]']]);

    // processTypedSqlSource uses 'wrong' as query name, but namespace is 'asdd'
    const result = processTypedSqlSource(
      sampleSource,
      'wrong',
      [{ name: 'field', typ: 'json', nullable: false }],
      annotationMap
    );

    assert.equal(result, sampleSource);
  });
});

describe('buildTypedSqlColumnAnnotationMap', () => {
  test('maps field name to documentation for Json fields', () => {
    const dmmf = {
      datamodel: {
        models: [
          {
            name: 'Model',
            fields: [
              { name: 'id', type: 'Int', dbName: null, documentation: undefined },
              { name: 'data', type: 'Json', dbName: null, documentation: '![number]' }
            ]
          }
        ],
        types: [],
        enums: []
      }
    } as never;

    const map = buildTypedSqlColumnAnnotationMap(dmmf);

    assert(!map.has('id'), 'Should not include non-Json fields');
    assert(map.has('data'), 'Should include Json fields');
    assert.equal(map.get('data'), '![number]');
  });

  test('uses dbName (@map) as the key when set', () => {
    const dmmf = {
      datamodel: {
        models: [
          {
            name: 'Model',
            fields: [{ name: 'myField', type: 'Json', dbName: 'my_field', documentation: '[T]' }]
          }
        ],
        types: [],
        enums: []
      }
    } as never;

    const map = buildTypedSqlColumnAnnotationMap(dmmf);

    assert(map.has('my_field'), 'Should use dbName as key');
    assert(!map.has('myField'), 'Should not use field name when dbName is set');
    assert.equal(map.get('my_field'), '[T]');
  });

  test('first model wins when the same column name appears in multiple models', () => {
    const dmmf = {
      datamodel: {
        models: [
          {
            name: 'A',
            fields: [{ name: 'data', type: 'Json', dbName: null, documentation: '[TypeA]' }]
          },
          {
            name: 'B',
            fields: [{ name: 'data', type: 'Json', dbName: null, documentation: '[TypeB]' }]
          }
        ],
        types: [],
        enums: []
      }
    } as never;

    const map = buildTypedSqlColumnAnnotationMap(dmmf);

    assert.equal(map.get('data'), '[TypeA]', 'First model should win');
  });

  test('sets undefined documentation for unannotated Json fields', () => {
    const dmmf = {
      datamodel: {
        models: [
          {
            name: 'Model',
            fields: [{ name: 'raw', type: 'Json', dbName: null, documentation: undefined }]
          }
        ],
        types: [],
        enums: []
      }
    } as never;

    const map = buildTypedSqlColumnAnnotationMap(dmmf);

    assert(map.has('raw'), 'Should include field even without documentation');
    assert.equal(map.get('raw'), undefined);
  });
});
