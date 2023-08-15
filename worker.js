import { parentPort, workerData } from 'node:worker_threads';
import Traverser from './lib/Traverser.js';

const { term, searchList } = workerData;

const traverser = new Traverser(term, searchList);

traverser.traverse().subscribe({
  next(searchResult) {
    parentPort.postMessage(searchResult);
  },
  complete() {
    process.exit(0);
  }
});
