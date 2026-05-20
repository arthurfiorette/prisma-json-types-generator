import { applyTextChanges, type TextDiff } from './text-changes';

describe('applyTextChanges', () => {
  it('should return original content when no changes are provided', () => {
    const content = 'Hello world';
    const changes: TextDiff[] = [];
    expect(applyTextChanges(content, changes)).toBe(content);
  });

  it('should apply a single character replacement', () => {
    const content = 'abcde';
    const changes: TextDiff[] = [{ start: 1, end: 2, text: 'X' }];
    expect(applyTextChanges(content, changes)).toBe('aXcde');
  });

  it('should apply a single substring replacement', () => {
    const content = 'Hello world';
    const changes: TextDiff[] = [{ start: 6, end: 11, text: 'there' }];
    expect(applyTextChanges(content, changes)).toBe('Hello there');
  });

  it('should apply a single insertion (end equals start)', () => {
    const content = 'ace';
    const changes: TextDiff[] = [{ start: 1, end: 1, text: 'b' }];
    expect(applyTextChanges(content, changes)).toBe('abce');
  });

  it('should apply a single deletion (new text is empty)', () => {
    const content = 'abcdef';
    const changes: TextDiff[] = [{ start: 2, end: 4, text: '' }];
    expect(applyTextChanges(content, changes)).toBe('abef');
  });

  it('should apply multiple non-overlapping changes', () => {
    const content = '0123456789';
    const changes: TextDiff[] = [
      { start: 1, end: 3, text: 'AB' },
      { start: 6, end: 8, text: 'CD' }
    ];
    expect(applyTextChanges(content, changes)).toBe('0AB345CD89');
  });

  it('should apply multiple non-overlapping changes that are out of order in the input array', () => {
    const content = 'abcdef';
    const changes: TextDiff[] = [
      { start: 3, end: 5, text: 'YZ' }, // Should become 'def' -> 'YZ'
      { start: 0, end: 2, text: 'AB' } // Should become 'ab' -> 'AB'
    ];
    expect(applyTextChanges(content, changes)).toBe('ABcYZf');
  });

  it('should handle changes that are out of order in the input array', () => {
    const content = 'hello world';
    const changes: TextDiff[] = [
      { start: 6, end: 11, text: 'there' }, // world -> there (later in content)
      { start: 0, end: 5, text: 'hi' } // hello -> hi (earlier in content)
    ];
    expect(applyTextChanges(content, changes)).toBe('hi there');
  });

  it('should handle changes that touch each other (adjacent)', () => {
    const content = 'abcdef';
    const changes: TextDiff[] = [
      { start: 0, end: 2, text: 'XX' },
      { start: 2, end: 4, text: 'YY' },
      { start: 4, end: 6, text: 'ZZ' }
    ];
    expect(applyTextChanges(content, changes)).toBe('XXYYZZ');
  });

  it('should handle insertion at the beginning', () => {
    const content = 'world';
    const changes: TextDiff[] = [{ start: 0, end: 0, text: 'Hello ' }];
    expect(applyTextChanges(content, changes)).toBe('Hello world');
  });

  it('should handle insertion at the end', () => {
    const content = 'Hello ';
    const changes: TextDiff[] = [{ start: 6, end: 6, text: 'world' }];
    expect(applyTextChanges(content, changes)).toBe('Hello world');
  });

  it('should handle replacement of entire string', () => {
    const content = 'original';
    const changes: TextDiff[] = [{ start: 0, end: 8, text: 'replacement' }];
    expect(applyTextChanges(content, changes)).toBe('replacement');
  });

  it('should handle multiple insertions in the same spot', () => {
    // This is an edge case where multiple changes have the same start position
    // The algorithm adds both insertions at the same position, so both get applied
    const content = 'ac';
    const changes: TextDiff[] = [
      { start: 1, end: 1, text: 'bb' },
      { start: 1, end: 1, text: 'B' }
    ];
    // Both changes have start=1, so both are inserted at position 1
    expect(applyTextChanges(content, changes)).toBe('abbBc');
  });

  it('should preserve content when start and end are equal with empty text', () => {
    const content = 'hello';
    const changes: TextDiff[] = [{ start: 2, end: 2, text: '' }];
    expect(applyTextChanges(content, changes)).toBe('hello');
  });

  it('should handle complex case with multiple operations', () => {
    const content = 'The quick brown fox jumps over the lazy dog';
    const changes: TextDiff[] = [
      { start: 0, end: 3, text: 'A' }, // Replace "The" with "A"
      { start: 10, end: 15, text: 'red' }, // Replace "brown" with "red"
      { start: 35, end: 39, text: 'sleepy' } // Replace "lazy" with "sleepy"
    ];
    // After applying these changes: "A quick red fox jumps over the sleepy dog"
    expect(applyTextChanges(content, changes)).toBe('A quick red fox jumps over the sleepy dog');
  });
});
