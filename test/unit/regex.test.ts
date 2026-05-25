import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateTypeNamesFromName } from '../../src/helpers/regex';

it('generateTypeNamesFromName', () => {
  const types = generateTypeNamesFromName('Model');

  assert.ok(types.includes('ModelGroup'));
  assert.ok(types.includes('ModelGroupByOutputType'));
  assert.ok(types.includes('ModelMinAggregateOutputType'));
  assert.ok(types.includes('ModelMaxAggregateOutputType'));

  assert.ok(!types.includes('ModelCountAggregate'));
  assert.ok(!types.includes('ModelCountAggregateOutputType'));
  assert.ok(!types.includes('ModelAvgAggregateOutputType'));
  assert.ok(!types.includes('ModelSumAggregateOutputType'));
});
