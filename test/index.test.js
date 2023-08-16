import { before, describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

describe('Main app', () => {
  const main = fileURLToPath(path.join(import.meta.url, '../../index.js'));
  const root = 'C:/Users/pc/Desktop/directory-traversal/test/root';
  const dest = 'C:/Users/pc/Desktop/directory-traversal/test/dest';

  const expected = [
    '.gitkeep',
    'ok.dll',
    'file3.dll',
    'file3-duplicate.dll',
    'sharepoint.sample.dll',
    'sharepoint.team.dll',
    'file2.dll'
  ].sort();

  before(async () => {
    for (const file of await readdir('test/dest', {
      recursive: false,
      encoding: 'utf8',
      withFileTypes: false
    })) {
      if (file === '.gitkeep') continue;

      await rm(`test/dest/${file}`, { recursive: true });
    }
  });

  it('should work as expected', { timeout: 1_500 }, async () => {
    const app = new Worker(main, {
      workerData: { root, dest },
      stdin: false,
      stdout: false,
      stderr: true
    });

    await new Promise((resolve, reject) => {
      app.once('exit', (code) => {
        if (code !== 0) {
          return reject(new Error('Worker ended with error'));
        }

        resolve();
      });
    });

    const files = await readdir(dest, {
      recursive: false,
      encoding: 'utf8',
      withFileTypes: false
    });

    assert.deepStrictEqual(files.sort(), expected);
  });
});
