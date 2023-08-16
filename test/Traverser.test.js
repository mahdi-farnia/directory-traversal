import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import Traverser from '../lib/Traverser.js';
import InstanceError from '../lib/InstanceError.js';

describe('Traverse directories by term in calling thread', () => {
  it('should validate arguments', () => {
    assert.throws(
      () => {
        new Traverser('sharepoint', ['test/root']);
      },
      InstanceError,
      'expects to validates first argument (term)'
    );

    assert.throws(
      () => {
        new Traverser(/sharepoint/i, 'test/root');
      },
      InstanceError,
      'expects to validates 2th argument (searchList)'
    );

    assert.doesNotThrow(() => {
      new Traverser(/sharepoint/i, ['test/root']);
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

  it('should notify traverse result', { timeout: 1_000 }, () => {
    const traverser = new Traverser(/sharepoint/i, ['test/root']);

    let resultFound = 0;
    return new Promise((resolve, reject) => {
      traverser.traverse().subscribe({
        next(searchResult) {
          if (!expected.includes(searchResult)) {
            throw new Error('unexpected search result');
          }

          ++resultFound;
        },
        error: reject,
        complete() {
          if (resultFound === expected.length) return resolve();

          throw new Error(
            `Result found count does not match the expected, expected ${expected.length} but received ${resultFound}`
          );
        }
      });
    });
  });
});
