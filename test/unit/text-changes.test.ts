import { strict as assert } from 'node:assert';
import { describe, test } from 'node:test';
import { applyTextChanges, type TextDiff } from '../../src/util/text-changes.js';

describe('applyTextChanges - precise text replacement', () => {
  test('should return unchanged content when no replacements are made', () => {
    const content = 'The quick brown fox jumps over the lazy dog';
    const changes: TextDiff[] = [];

    const result = applyTextChanges(content, changes);

    assert.equal(result, 'The quick brown fox jumps over the lazy dog');
  });

  test('should replace exact substring without affecting surrounding text', () => {
    const content = 'The quick brown fox jumps over the lazy dog';
    const changes: TextDiff[] = [
      { start: 10, end: 19, text: 'red cat' } // Replace "brown fox"
    ];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'The quick red cat jumps over the lazy dog');
  });

  test('should handle replacement at string start', () => {
    const content = 'Original text here';
    const changes: TextDiff[] = [{ start: 0, end: 8, text: 'Modified' }];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'Modified text here');
  });

  test('should handle replacement at string end', () => {
    const content = 'Text goes here';
    const changes: TextDiff[] = [{ start: 10, end: 14, text: 'there' }];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'Text goes there');
  });

  test('should handle zero-length insertion correctly', () => {
    const content = 'Hello world';
    const changes: TextDiff[] = [
      { start: 5, end: 5, text: ' beautiful' } // Insert at position 5
    ];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'Hello beautiful world');
  });

  test('should handle complete deletion correctly', () => {
    const content = 'Remove this part from text';
    const changes: TextDiff[] = [
      { start: 7, end: 17, text: '' } // Delete "this part "
    ];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'Remove from text');
  });

  test('should apply multiple non-overlapping replacements correctly', () => {
    const content = 'First second third fourth';
    const changes: TextDiff[] = [
      { start: 19, end: 25, text: 'FOURTH' }, // "fourth" -> "FOURTH"
      { start: 6, end: 12, text: 'SECOND' }, // "second" -> "SECOND"
      { start: 0, end: 5, text: 'FIRST' } // "First" -> "FIRST"
    ];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'FIRST SECOND third FOURTH');
  });

  test('should handle adjacent replacements without gaps or overlaps', () => {
    const content = 'abcdefghij';
    const changes: TextDiff[] = [
      { start: 0, end: 3, text: 'ABC' }, // "abc" -> "ABC"
      { start: 3, end: 6, text: 'DEF' }, // "def" -> "DEF"
      { start: 6, end: 10, text: 'GHIJ' } // "ghij" -> "GHIJ"
    ];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'ABCDEFGHIJ');
  });

  test('should handle unicode characters correctly', () => {
    const content = 'Test 🌍 content';
    const emojiStart = content.indexOf('🌍');
    const emojiEnd = emojiStart + '🌍'.length;

    const changes: TextDiff[] = [{ start: emojiStart, end: emojiEnd, text: '🌎' }];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'Test 🌎 content');
  });

  test('should handle newlines and whitespace precisely', () => {
    const content = 'Line 1\n  Line 2\n    Line 3';
    const changes: TextDiff[] = [
      { start: 9, end: 15, text: 'Modified' } // Replace "Line 2"
    ];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'Line 1\n  Modified\n    Line 3');
  });

  test('should handle overlapping replacements by start position order', () => {
    const content = 'abcdefghij';
    const changes: TextDiff[] = [
      { start: 5, end: 8, text: 'XYZ' }, // "fgh" -> "XYZ"
      { start: 2, end: 6, text: 'MNOP' } // "cdef" -> "MNOP"
    ];

    const result = applyTextChanges(content, changes);
    // Should apply in start position order: first MNOP (2-6), then XYZ affects what's left
    assert.equal(result, 'abMNOPXYZij');
  });

  test('should preserve content outside of replacements exactly', () => {
    const content =
      '/* Important comment */\nexport interface User {\n  id: JsonValue;\n  name: string;\n}\n// End comment';
    const jsonValuePos = content.indexOf('JsonValue');
    const changes: TextDiff[] = [
      { start: jsonValuePos, end: jsonValuePos + 'JsonValue'.length, text: 'UserID' }
    ];

    const result = applyTextChanges(content, changes);
    assert(result.includes('/* Important comment */'));
    assert(result.includes('export interface User {'));
    assert(result.includes('id: UserID;'));
    assert(result.includes('name: string;'));
    assert(result.includes('// End comment'));
    assert(!result.includes('JsonValue'));
  });

  test('should handle empty content', () => {
    const content = '';
    const changes: TextDiff[] = [];

    const result = applyTextChanges(content, changes);
    assert.equal(result, '');
  });

  test('should handle single character replacement', () => {
    const content = 'a';
    const changes: TextDiff[] = [{ start: 0, end: 1, text: 'b' }];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'b');
  });

  test('should handle multiple insertions at same position', () => {
    const content = 'Hello world';
    const changes: TextDiff[] = [
      { start: 5, end: 5, text: ' beautiful' },
      { start: 5, end: 5, text: ' amazing' }
    ];

    const result = applyTextChanges(content, changes);
    // Both insertions should appear in order they were added
    assert.equal(result, 'Hello beautiful amazing world');
  });

  test('should not modify original content or changes array', () => {
    const content = 'Original content';
    const changes: TextDiff[] = [{ start: 0, end: 8, text: 'Modified' }];
    const originalChanges = [...changes];

    const result = applyTextChanges(content, changes);

    // Original parameters should remain unchanged
    assert.equal(content, 'Original content');
    assert.deepEqual(changes, originalChanges);
    assert.equal(result, 'Modified content');
  });

  test('should handle complex replacement scenario', () => {
    const content = 'function oldName(param1, param2) { return oldName.helper(param1, param2); }';
    const firstOld = content.indexOf('oldName');
    const secondOld = content.indexOf('oldName', firstOld + 1);

    const changes: TextDiff[] = [
      { start: firstOld, end: firstOld + 'oldName'.length, text: 'newName' },
      { start: secondOld, end: secondOld + 'oldName'.length, text: 'newName' }
    ];

    const result = applyTextChanges(content, changes);
    assert.equal(
      result,
      'function newName(param1, param2) { return newName.helper(param1, param2); }'
    );
  });

  test('should handle edge case with replacement at exact content boundaries', () => {
    const content = 'start middle end';
    const changes: TextDiff[] = [
      { start: 0, end: 5, text: 'BEGIN' }, // "start" -> "BEGIN"
      { start: 13, end: 16, text: 'FINISH' } // "end" -> "FINISH"
    ];

    const result = applyTextChanges(content, changes);
    assert.equal(result, 'BEGIN middle FINISH');
  });
});
