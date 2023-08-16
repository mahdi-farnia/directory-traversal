import { describe, it } from 'node:test';
import assert from 'node:assert';
import TermTraversal from '../lib/TermTraversal.js';
import InstanceError from '../lib/InstanceError.js';
import path from 'node:path';

describe('Traverse directories by term in parallel', () => {
  it('should validate arguments', () => {
    assert.throws(
      () => {
        new TermTraversal('sharepoint', ['test/root']);
      },
      InstanceError,
      'expects to validates first argument (term)'
    );

    assert.throws(
      () => {
        new TermTraversal(/sharepoint/i, 'test/root');
      },
      InstanceError,
      'expects to validates 2th argument (searchList)'
    );

    assert.doesNotThrow(() => {
      new TermTraversal(/sharepoint/i, ['test/root']);
    }, 'expects to accept correct arguments');
  });

  const expected = [
    'test/root/sharepoint.team.dll',
    'test/root/sharepoint.sample.dll',
    'test/root/sharepoint',
    'test/root/microsoft.sharepoint.folder',
    'test/root/another.microsoft/sharepoint.again'
  ]
    .map(path.normalize)
    .sort();

  it('should return term matches', { timeout: 1_000 }, async (t) => {
    const traverse = new TermTraversal(/sharepoint/i, ['test/root']);

    const result = await traverse.getResult();
    assert.deepStrictEqual(result.sort(), expected);
  });
});
