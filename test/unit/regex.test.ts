import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateTypeNamesFromName } from '../../src/helpers/regex';

describe('generateTypeNamesFromName', () => {
  it('includes GroupBy and safe aggregate output types', () => {
    const types = generateTypeNamesFromName('Model');

    assert.ok(types.includes('ModelGroup'));
    assert.ok(types.includes('ModelGroupByOutputType'));
    assert.ok(types.includes('ModelMinAggregateOutputType'));
    assert.ok(types.includes('ModelMaxAggregateOutputType'));
  });

  it('does not include numeric aggregate output types', () => {
    const types = generateTypeNamesFromName('Model');

    assert.ok(!types.includes('ModelCountAggregate'));
    assert.ok(!types.includes('ModelCountAggregateOutputType'));
    assert.ok(!types.includes('ModelAvgAggregateOutputType'));
    assert.ok(!types.includes('ModelSumAggregateOutputType'));
  });
});
