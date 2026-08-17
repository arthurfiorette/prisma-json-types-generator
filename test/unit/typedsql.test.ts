import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import ts from 'typescript';
import { columnDocsKey, handleTypedSqlFile, parseSqlAnnotations } from '../../src/handler/typedsql';
import { buildColumnDocs } from '../../src/on-generate';
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
  cfg: PrismaJsonTypesGeneratorConfig = config,
  parameters: Array<{
    name: string;
    typ: string;
    nullable: boolean;
    documentation: string | null;
  }> = []
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
      parameters,
      resultColumns
    },
    columnDocs,
    cfg
  );

  return applyTextChanges(source, writer.changes);
}

describe('handleTypedSqlFile - TypedSQL result column replacement', () => {
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

  test('keeps | null on a nullable json-array column', () => {
    const source = `import * as $runtime from "../runtime/client";
export namespace q {
  export type Parameters = [];
  export type Result = {
    tags: $runtime.JsonValue[] | null
  }
}
`;
    const columnDocs = new Map([['tags', '![string]']]);

    const result = processTypedSqlSource(
      source,
      'q',
      [{ name: 'tags', typ: 'json-array', nullable: true }],
      columnDocs
    );

    assert(
      result.includes('tags: (string)[] | null'),
      `Expected the nullability prisma emitted to be preserved in:\n${result}`
    );
  });

  test('replaces a quoted column name', () => {
    const source = `import * as $runtime from "../runtime/client";
export namespace q {
  export type Parameters = [];
  export type Result = {
    "my-column": $runtime.JsonValue
  }
}
`;
    const columnDocs = new Map([['my-column', '![number]']]);

    const result = processTypedSqlSource(
      source,
      'q',
      [{ name: 'my-column', typ: 'json', nullable: false }],
      columnDocs
    );

    assert(result.includes('"my-column": (number)'), `Expected quoted column in:\n${result}`);
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

  test('replaces an annotated non-json column', () => {
    const columnDocs = new Map([['id', '![1 | 2]']]);

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [{ name: 'id', typ: 'int', nullable: false }],
      columnDocs
    );

    assert(result.includes('id: (1 | 2)'), `Expected 'id: (1 | 2)' in:\n${result}`);
  });

  test('leaves an unannotated non-json column as prisma wrote it', () => {
    // An ambiguous column reaches the handler this way too: on-generate drops its docs
    const columnDocs = new Map<string, string | undefined>([['id', undefined]]);

    const result = processTypedSqlSource(
      sampleSource,
      'asdd',
      [{ name: 'id', typ: 'int', nullable: false }],
      columnDocs
    );

    // `number` is a real type, unlike `JsonValue`, so it must survive untouched --
    // degrading it to `unknown` the way an unannotated json column does is strictly worse
    assert(result.includes('id: number'), `Expected 'id: number' untouched in:\n${result}`);
  });

  test('leaves an enum column alone, having no node that stands for its type', () => {
    const source = `export namespace asdd {
  export type Parameters = [];
  export type Result = {
    status: $DbEnums["status_type"]
  }
}
`;

    const result = processTypedSqlSource(
      source,
      'asdd',
      [{ name: 'status', typ: 'status_type', nullable: false }],
      new Map([['status', '![number]']])
    );

    assert(
      result.includes('status: $DbEnums["status_type"]'),
      `Expected the enum untouched in:\n${result}`
    );
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

describe('handleTypedSqlFile - TypedSQL parameter replacement', () => {
  const paramSource = `import * as $runtime from "../runtime/client";

export const q = $runtime.makeTypedQueryFactory("SELECT 1") as (filter: $runtime.InputJsonObject, untyped: $runtime.InputJsonObject) => $runtime.TypedSql<q.Parameters, q.Result>

export namespace q {
  export type Parameters = [filter: $runtime.InputJsonObject, untyped: $runtime.InputJsonObject]
  export type Result = {
    id: number
  }
}
`;

  test('replaces an annotated json parameter in both the tuple and the factory', () => {
    const result = processTypedSqlSource(paramSource, 'q', [], new Map(), config, [
      { name: 'filter', typ: 'json', nullable: false, documentation: '![{ a: number }]' },
      { name: 'untyped', typ: 'json', nullable: false, documentation: null }
    ]);

    assert(
      result.includes('Parameters = [filter: ({ a: number }), untyped: $runtime.InputJsonObject]'),
      `Expected the namespace tuple to be rewritten in:\n${result}`
    );
    assert(
      result.includes('as (filter: ({ a: number }), untyped: $runtime.InputJsonObject) =>'),
      `Expected the factory signature to be rewritten in:\n${result}`
    );
  });

  test('resolves a namespace type for a json parameter', () => {
    const result = processTypedSqlSource(paramSource, 'q', [], new Map(), config, [
      { name: 'filter', typ: 'json', nullable: false, documentation: '[Filter]' }
    ]);

    assert(
      result.includes('filter: PTypedSqlJson.Filter'),
      `Expected namespace type in:\n${result}`
    );
  });

  test('leaves a json parameter whose description is plain prose untouched', () => {
    const result = processTypedSqlSource(paramSource, 'q', [], new Map(), config, [
      { name: 'filter', typ: 'json', nullable: false, documentation: 'The filter to apply.' }
    ]);

    assert.equal(result, paramSource);
  });

  test('leaves unannotated json parameters as prisma emitted them', () => {
    const result = processTypedSqlSource(paramSource, 'q', [], new Map(), config, [
      { name: 'filter', typ: 'json', nullable: false, documentation: null }
    ]);

    assert.equal(result, paramSource);
  });

  test('does not treat allowAny=false as an annotation for parameters', () => {
    const result = processTypedSqlSource(paramSource, 'q', [], new Map(), config, [
      { name: 'filter', typ: 'json', nullable: false, documentation: null }
    ]);

    assert(
      !result.includes('filter: unknown'),
      `Unannotated parameters must not become unknown in:\n${result}`
    );
  });

  const scalarParamSource = `import * as $runtime from "../runtime/client";

export const q = $runtime.makeTypedQueryFactory("SELECT 1") as (userId: string, limit: number) => $runtime.TypedSql<q.Parameters, q.Result>

export namespace q {
  export type Parameters = [userId: string, limit: number]
  export type Result = {
    id: number
  }
}
`;

  test('replaces an annotated non-json parameter in both the tuple and the factory', () => {
    const result = processTypedSqlSource(scalarParamSource, 'q', [], new Map(), config, [
      { name: 'userId', typ: 'string', nullable: false, documentation: '[UserIdString]' },
      { name: 'limit', typ: 'int', nullable: false, documentation: null }
    ]);

    assert(
      result.includes('Parameters = [userId: PTypedSqlJson.UserIdString, limit: number]'),
      `Expected the namespace tuple to be rewritten in:\n${result}`
    );
    assert(
      result.includes('as (userId: PTypedSqlJson.UserIdString, limit: number) =>'),
      `Expected the factory signature to be rewritten in:\n${result}`
    );
  });

  test('leaves an unannotated non-json parameter as prisma emitted it', () => {
    const result = processTypedSqlSource(scalarParamSource, 'q', [], new Map(), config, [
      { name: 'userId', typ: 'string', nullable: false, documentation: null },
      { name: 'limit', typ: 'int', nullable: false, documentation: null }
    ]);

    assert.equal(result, scalarParamSource);
  });
});

describe('buildColumnDocs — annotated columns with @map and collisions', () => {
  test('maps every field name to its documentation, whatever its type', () => {
    const { columnDocs } = buildColumnDocs(
      [
        {
          fields: [
            { name: 'id', type: 'Int', dbName: null, documentation: undefined },
            { name: 'userId', type: 'String', dbName: null, documentation: '[UserIdString]' },
            { name: 'data', type: 'Json', dbName: null, documentation: '![number]' }
          ]
        }
      ],
      config
    );

    assert.equal(columnDocs.get(columnDocsKey('json', 'data')), '![number]');

    // A `String` field annotates its TypedSQL column exactly as it annotates the model
    assert.equal(columnDocs.get(columnDocsKey('string', 'userId')), '[UserIdString]');

    // Unannotated fields are registered too, so that a model which does not annotate a
    // column counts as disagreeing with one that does
    assert(columnDocs.has(columnDocsKey('int', 'id')), 'Should register unannotated fields');
    assert.equal(columnDocs.get(columnDocsKey('int', 'id')), undefined);
  });

  test('does not collide two same-named columns of different scalar types', () => {
    const { columnDocs, ambiguous } = buildColumnDocs(
      [
        {
          fields: [
            { name: 'transcript', type: 'Json', dbName: null, documentation: '[CallTranscript]' }
          ]
        },
        { fields: [{ name: 'transcript', type: 'String', dbName: null, documentation: undefined }] }
      ],
      config
    );

    // Prisma reports the column's kind, and a `json` column cannot have been read from a
    // `String` field -- so the unannotated one is not a candidate and cannot outvote this
    assert.equal(columnDocs.get(columnDocsKey('json', 'transcript')), '[CallTranscript]');
    assert.equal(ambiguous.size, 0, 'Different scalar types are different columns');
  });

  test('reports a conflict between an annotated and an unannotated model', () => {
    const { columnDocs, ambiguous } = buildColumnDocs(
      [
        {
          fields: [
            { name: 'userId', type: 'String', dbName: null, documentation: '[UserIdString]' }
          ]
        },
        { fields: [{ name: 'userId', type: 'String', dbName: null, documentation: undefined }] }
      ],
      config
    );

    assert(
      ambiguous.has(columnDocsKey('string', 'userId')),
      'One model declining to annotate is a disagreement'
    );
    assert.equal(columnDocs.get(columnDocsKey('string', 'userId')), undefined);
  });

  test('keys a @map-ed field under both the db column name and the field name', () => {
    const { columnDocs, ambiguous } = buildColumnDocs(
      [{ fields: [{ name: 'myField', type: 'Json', dbName: 'my_field', documentation: '[T]' }] }],
      config
    );

    // `SELECT my_field` reports the db name, `SELECT my_field AS "myField"` the field name
    assert.equal(
      columnDocs.get(columnDocsKey('json', 'my_field')),
      '[T]',
      'Should be reachable by db column name'
    );
    assert.equal(
      columnDocs.get(columnDocsKey('json', 'myField')),
      '[T]',
      'Should be reachable by field name'
    );
    assert.equal(ambiguous.size, 0, 'One field under two names is not a conflict');
  });

  test('does not treat models agreeing on a @map-ed column as ambiguous', () => {
    const { columnDocs, ambiguous } = buildColumnDocs(
      [
        { fields: [{ name: 'myField', type: 'Json', dbName: 'my_field', documentation: '[T]' }] },
        { fields: [{ name: 'myField', type: 'Json', dbName: 'my_field', documentation: '[T]' }] }
      ],
      config
    );

    assert.equal(ambiguous.size, 0, 'Identical annotations are not a conflict');
    assert.equal(columnDocs.get(columnDocsKey('json', 'myField')), '[T]');
  });

  test('reports a conflict between a field name and another model’s @map-ed column', () => {
    const { columnDocs, ambiguous } = buildColumnDocs(
      [
        { fields: [{ name: 'meta', type: 'Json', dbName: null, documentation: '[TypeA]' }] },
        { fields: [{ name: 'metaData', type: 'Json', dbName: 'meta', documentation: '[TypeB]' }] }
      ],
      config
    );

    assert(
      ambiguous.has(columnDocsKey('json', 'meta')),
      'Collision across the two naming styles is still a conflict'
    );
    assert.equal(columnDocs.get(columnDocsKey('json', 'meta')), undefined);
  });

  test('drops the annotation when models disagree on the same column name', () => {
    const { columnDocs, ambiguous } = buildColumnDocs(
      [
        { fields: [{ name: 'data', type: 'Json', dbName: null, documentation: '[TypeA]' }] },
        { fields: [{ name: 'data', type: 'Json', dbName: null, documentation: '[TypeB]' }] }
      ],
      config
    );

    assert(
      ambiguous.has(columnDocsKey('json', 'data')),
      'Conflicting column should be reported as ambiguous'
    );
    assert.equal(
      columnDocs.get(columnDocsKey('json', 'data')),
      undefined,
      'Ambiguous column must not silently take one of the two types'
    );
  });

  test('models agreeing on the same column name are not ambiguous', () => {
    const { columnDocs, ambiguous } = buildColumnDocs(
      [
        { fields: [{ name: 'data', type: 'Json', dbName: null, documentation: '[Same]' }] },
        { fields: [{ name: 'data', type: 'Json', dbName: null, documentation: '[Same]' }] }
      ],
      config
    );

    assert.equal(ambiguous.size, 0, 'Identical annotations are not a conflict');
    assert.equal(columnDocs.get(columnDocsKey('json', 'data')), '[Same]');
  });

  test('compares the resolved type, not the raw doc-comment', () => {
    const { ambiguous } = buildColumnDocs(
      [
        { fields: [{ name: 'data', type: 'Json', dbName: null, documentation: '[Same]' }] },
        {
          fields: [
            { name: 'data', type: 'Json', dbName: null, documentation: 'Some prose.\n[Same]' }
          ]
        }
      ],
      config
    );

    assert.equal(ambiguous.size, 0, 'Same type reached through different prose is not a conflict');
  });

  test('sets undefined documentation for unannotated Json fields', () => {
    const { columnDocs } = buildColumnDocs(
      [{ fields: [{ name: 'raw', type: 'Json', dbName: null, documentation: undefined }] }],
      config
    );

    assert(
      columnDocs.has(columnDocsKey('json', 'raw')),
      'Should include field even without documentation'
    );
    assert.equal(columnDocs.get(columnDocsKey('json', 'raw')), undefined);
  });
});

describe('parseSqlAnnotations - SQL file annotation parsing', () => {
  test('parses an inline literal annotation', () => {
    const result = parseSqlAnnotations('-- @pjt-type my_col ![number]\nSELECT 1');
    assert.equal(result.size, 1);
    assert.equal(result.get('my_col'), '![number]');
  });

  test('parses a namespace-based annotation', () => {
    const result = parseSqlAnnotations('-- @pjt-type col [MyType]\nSELECT 1');
    assert.equal(result.size, 1);
    assert.equal(result.get('col'), '[MyType]');
  });

  test('parses multiple annotations', () => {
    const sql = '-- @pjt-type col1 ![string]\n-- @pjt-type col2 [T]\nSELECT 1';
    const result = parseSqlAnnotations(sql);
    assert.equal(result.size, 2);
    assert.equal(result.get('col1'), '![string]');
    assert.equal(result.get('col2'), '[T]');
  });

  test('ignores non-annotation comments', () => {
    const result = parseSqlAnnotations('-- This is a regular comment\nSELECT 1');
    assert.equal(result.size, 0);
  });

  test('returns an empty map for an empty string', () => {
    assert.equal(parseSqlAnnotations('').size, 0);
  });

  test('handles extra whitespace between -- and @pjt-type', () => {
    const result = parseSqlAnnotations('--   @pjt-type  col  ![string]');
    assert.equal(result.size, 1);
    assert.equal(result.get('col'), '![string]');
  });

  test('last annotation wins for duplicate column names', () => {
    const sql = '-- @pjt-type col ![number]\n-- @pjt-type col ![string]';
    const result = parseSqlAnnotations(sql);
    assert.equal(result.size, 1);
    assert.equal(result.get('col'), '![string]');
  });

  test('annotation is usable by createType via handleTypedSqlFile', () => {
    const source = `import * as $runtime from "../runtime/client";
export namespace aliasQuery {
  export type Parameters = [];
  export type Result = {
    id: number
    field_alias: $runtime.JsonValue
  }
}
`;
    const sqlContent =
      '-- @pjt-type field_alias ![number]\nSELECT id, field AS field_alias FROM "Model"';
    const sqlAnnotations = parseSqlAnnotations(sqlContent);

    const tsSource = ts.createSourceFile(
      'aliasQuery.ts',
      source,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS
    );

    const changes: TextDiff[] = [];
    const writer = {
      changes,
      multifile: true as const,
      replace(start: number, end: number, text: string) {
        changes.push({ start, end, text });
      }
    };

    const config: PrismaJsonTypesGeneratorConfig = {
      namespace: 'PrismaJson',
      allowAny: false,
      useType: undefined,
      clientOutput: undefined
    };

    handleTypedSqlFile(
      tsSource,
      writer as never,
      {
        name: 'aliasQuery',
        source: 'SELECT id, field AS field_alias FROM "Model"',
        documentation: null,
        parameters: [],
        resultColumns: [
          { name: 'id', typ: 'int', nullable: false },
          { name: 'field_alias', typ: 'json', nullable: false }
        ]
      },
      sqlAnnotations,
      config
    );

    const result = applyTextChanges(source, changes);
    assert(
      result.includes('field_alias: (number)'),
      `Expected 'field_alias: (number)' in:\n${result}`
    );
    assert(result.includes('id: number'), `Expected 'id: number' untouched in:\n${result}`);
  });
});
