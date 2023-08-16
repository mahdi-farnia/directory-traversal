import InstanceError from './InstanceError.js';
import {
  accessSync,
  constants,
  readdirSync,
  statSync,
  openSync,
  closeSync,
  writeSync
} from 'node:fs';
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
  #logFileFd;

  /**
   * @param term **Should not have global flag**
   */
  constructor(term, searchList) {
    this.#validateArguments(term, searchList);

    this.#term = term;
    this.#searchList = searchList;
    this.#logFileFd = openSync(
      path.join(process.cwd(), 'traverser.log'),
      constants.O_APPEND | constants.O_CREAT
    );

    writeSync(
      this.#logFileFd,
      `[${new Date().toUTCString()}] Start Traversing ${this.#term.toString()} in:\n\t${this.#searchList.join(
        '\n\t'
      )}\n`,
      null,
      'utf8'
    );
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

      closeSync(this.#logFileFd);
      sub.complete();
    });
  }

  #lookup(sub, itemPath) {
    // Found!
    if (this.#term.test(itemPath)) {
      sub.next(itemPath);
      return;
    }

    try {
      accessSync(itemPath, constants.F_OK);
    } catch (e) {
      writeSync(this.#logFileFd, `- error: item not visible: ${itemPath}\n`, null, 'utf8');
      return;
    }

    let stat;
    try {
      stat = statSync(itemPath, { throwIfNoEntry: false });
    } catch (e) {
      writeSync(this.#logFileFd, `- error: could not get stat: ${itemPath}\n`, null, 'utf8');
      return;
    }

    // This state maybe unreachable because all paths are taken just now
    // For safety reasons...
    if (!stat || !stat.isDirectory()) return;

    // Search directory items in next iteration
    let newItems;
    try {
      newItems = readdirSync(itemPath, {
        recursive: false,
        withFileTypes: false,
        encoding: 'utf8'
      }).map((dirItem) => path.join(itemPath, dirItem));
    } catch (e) {
      writeSync(this.#logFileFd, `- error: failed to readdir: ${itemPath}\n`, null, 'utf8');
      return;
    }

    this.#searchList = this.#searchList.concat(newItems);
  }
}

export default Traverser;
