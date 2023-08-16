import { Worker } from 'node:worker_threads';
import { fromEvent } from 'rxjs';
import InstanceError from './InstanceError.js';
import { join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import logUpdate from 'log-update';

class TermTraversal {
  #worker;
  /**
   * @type {Promise<string[]>}
   */
  #result;

  constructor(term, searchList) {
    this.#validateArguments(term, searchList);

    const workerPath = fileURLToPath(joinPath(import.meta.url, '../../worker.js'));

    this.#worker = new Worker(workerPath, {
      stderr: true,
      stdin: true,
      stdout: true,
      workerData: { term, searchList }
    });

    this.#registerListeners();
  }

  #validateArguments(term, searchList) {
    if (!(term instanceof RegExp)) {
      throw new InstanceError(term, 'RegExp');
    }

    if (!Array.isArray(searchList)) {
      throw new InstanceError(searchList, 'Array');
    }
  }

  #registerListeners() {
    const targetsPath = [];

    this.#result = new Promise((resolve, reject) => {
      const messageSub = fromEvent(this.#worker, 'message').subscribe((result) => {
        targetsPath.push(result);
        logUpdate(`- Found ${targetsPath.length} items`);
      });

      this.#worker.once('exit', (code) => {
        if (code !== 0) reject();
        else resolve(targetsPath);

        messageSub.unsubscribe();
      });
    });
  }

  getResult() {
    return this.#result;
  }
}

export default TermTraversal;
