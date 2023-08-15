import InstanceError from './InstanceError.js';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { Observable } from 'rxjs';

class Traverser {
  /**
   * @type {RegExp}
   */
  #term;
  /**
   * @type {string[]}
   */
  #searchList;

  /**
   * @param term **Should not have global flag**
   */
  constructor(term, searchList) {
    this.#validateArguments(term, searchList);

    this.#term = term;
    this.#searchList = searchList;
  }

  #validateArguments(term, searchList) {
    if (!(term instanceof RegExp)) {
      throw new InstanceError(term, 'RegExp');
    }

    if (!Array.isArray(searchList)) {
      throw new InstanceError(searchList, 'Array');
    }
  }

  /**
   * REALLY EXPENSIVE CALL
   *
   * will block calling thread until process finishes
   */
  traverse() {
    return new Observable((sub) => {
      // Stop here until traverse ends
      while (this.#searchList.length > 0) {
        // Cache len because of array mutation
        const len = this.#searchList.length;

        for (let i = 0; i < len; ++i) {
          this.#lookup(sub, this.#searchList[i]);
        }

        // slice already looked up paths
        this.#searchList = this.#searchList.slice(len);
      }

      sub.complete();
    });
  }

  #lookup(sub, itemPath) {
    // Found!
    if (this.#term.test(itemPath)) {
      sub.next(itemPath);
      return;
    }

    const stat = statSync(itemPath, { throwIfNoEntry: false });

    // This state maybe unreachable because all paths are taken just now
    // For safety reasons...
    if (!stat || !stat.isDirectory()) return;

    // Search directory items in next iteration
    const newItems = readdirSync(itemPath, {
      recursive: false,
      withFileTypes: false,
      encoding: 'utf8'
    }).map((dirItem) => path.join(itemPath, dirItem));

    this.#searchList = this.#searchList.concat(newItems);
  }
}

export default Traverser;