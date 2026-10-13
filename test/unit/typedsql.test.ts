import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import { rewriteTypedSqlFile } from '../../src/handler/typedsql.js';
import { parseSqlAnnotations } from '../../src/helpers/sql-annotations.js';

describe('parseSqlAnnotations', () => {
  test('parses type and literal annotations', () => {
    const result = parseSqlAnnotations(
      '-- [Profile] profile\n--![{ a: 1 | 2 }] stats\nSELECT profile, stats FROM t'
    );

    assert.deepEqual(
      [...result],
      [
        ['profile', '[Profile]'],
        ['stats', '![{ a: 1 | 2 }]']
      ]
    );
  });

  test('supports quoted column names with escaped quotes', () => {
    const result = parseSqlAnnotations('-- [T] "my ""col"""\nSELECT 1');

    assert.equal(result.get('my "col"'), '[T]');
  });

  test('supports nested brackets and CRLF line endings', () => {
    const result = parseSqlAnnotations('-- ![[number[]][]] nested\r\n-- [A] other\r\nSELECT 1');

    assert.equal(result.get('nested'), '![[number[]][]]');
    assert.equal(result.get('other'), '[A]');
  });

  test('ignores prose, @param tags and lines without a single column name', () => {
    const result = parseSqlAnnotations(
      [
        '-- Returns the users',
        '-- [WIP] needs an index',
        '-- [T]',
        '-- @param {Json} $1:filter [Filter]',
        'SELECT 1'
      ].join('\n')
    );

    assert.equal(result.size, 0);
  });

  test('only reads the leading comment block', () => {
    const result = parseSqlAnnotations('\n-- [A] a\n\nSELECT a, b\n-- [B] b\nFROM t');

    assert.deepEqual([...result.keys()], ['a']);
  });
});

// Copied verbatim from prisma-client output
const NEW_CLIENT = `import * as $runtime from "@prisma/client/runtime/client"

/**
 * @param filter [Filter]
 */
export const q = $runtime.makeTypedQueryFactory("SELECT ...") as (filter: $runtime.InputJsonObject, limit: number) => $runtime.TypedSql<q.Parameters, q.Result>

export namespace q {
  export type Parameters = [filter: $runtime.InputJsonObject, limit: number]
  export type Result = {
    id: number
    profile: $runtime.JsonValue
    meta: $runtime.JsonValue | null
    tags: $runtime.JsonValue[] | null
    email: string
    ["weird \\"name\\""]: $runtime.JsonValue | null
  }
}
`;

// Copied verbatim from prisma-client-js output
const OLD_CLIENT = `import * as $runtime from "../runtime/client"

export const q: (filter: $runtime.InputJsonObject, limit: number) => $runtime.TypedSql<q.Parameters, q.Result>

export namespace q {
  export type Parameters = [filter: $runtime.InputJsonObject, limit: number]
  export type Result = {
    id: number
    profile: $runtime.JsonValue
  }
}
`;

describe('rewriteTypedSqlFile', () => {
  test('replaces only the base type, keeping nullability and arrays', () => {
    const { content, changed } = rewriteTypedSqlFile(NEW_CLIENT, 'q', {
      columns: new Map([
        ['profile', 'NS.Profile'],
        ['meta', '(1 | 2)'],
        ['tags', 'NS.Tag'],
        ['email', 'NS.Email'],
        ['weird "name"', 'NS.Weird']
      ]),
      parameters: new Map()
    });

    assert.ok(changed);
    assert.match(content, /\n {4}id: number\n/);
    assert.match(content, /\n {4}profile: NS\.Profile\n/);
    assert.match(content, /\n {4}meta: \(1 \| 2\) \| null\n/);
    assert.match(content, /\n {4}tags: NS\.Tag\[\] \| null\n/);
    assert.match(content, /\n {4}email: NS\.Email\n/);
    assert.match(content, /\n {4}\["weird \\"name\\""\]: NS\.Weird \| null\n/);
  });

  test('replaces parameters in the namespace tuple and the factory cast', () => {
    const { content } = rewriteTypedSqlFile(NEW_CLIENT, 'q', {
      columns: new Map(),
      parameters: new Map([[0, 'NS.Filter']])
    });

    assert.match(content, /as \(filter: NS\.Filter, limit: number\) =>/);
    assert.match(content, /Parameters = \[filter: NS\.Filter, limit: number\]/);
  });

  test('replaces parameters in the prisma-client-js declaration', () => {
    const { content } = rewriteTypedSqlFile(OLD_CLIENT, 'q', {
      columns: new Map([['profile', 'NS.Profile']]),
      parameters: new Map([[0, 'NS.Filter']])
    });

    assert.match(content, /export const q: \(filter: NS\.Filter, limit: number\) =>/);
    assert.match(content, /Parameters = \[filter: NS\.Filter, limit: number\]/);
    assert.match(content, /profile: NS\.Profile\n/);
  });

  test('leaves other queries and unknown columns untouched', () => {
    const types = { columns: new Map([['missing', 'NS.X']]), parameters: new Map() };

    assert.deepEqual(rewriteTypedSqlFile(NEW_CLIENT, 'q', types), {
      content: NEW_CLIENT,
      changed: false
    });

    types.columns.set('profile', 'NS.Profile');

    assert.deepEqual(rewriteTypedSqlFile(NEW_CLIENT, 'other', types), {
      content: NEW_CLIENT,
      changed: false
    });
  });
});
