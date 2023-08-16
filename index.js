import { join as joinPath, basename } from 'node:path';
import TermTraversal from './lib/TermTraversal.js';
import { createInterface } from 'node:readline/promises';
import assert from 'node:assert';
import { copyFile, stat, constants, access } from 'node:fs/promises';
import { isMainThread, workerData } from 'node:worker_threads';

const isTesting = !isMainThread;

//
// Preparing
// Checking environment requirements
//
assertTestData('root', 'root path should be supplied in testing');
assertTestData('dest', 'dest path should be supplied in testing');

console.log('This program should run as root/administrator');
console.log('Press ^C to exit program at any time\n');

const tty = createInterface(process.stdin, process.stdout);

//
// Step 1
// Traverse and search for directories including sharepoint term
//
const root = isTesting ? workerData.root : await getPath('? Enter root directory to search: ');

const dest = isTesting ? workerData.dest : await getPath('? Enter destination of .dll files: ');

console.log('- Searching, This might take a couple of minutes...');

const sharePointTraversal = new TermTraversal(/sharepoint/i, [root]);
const sharepointTargets = await sharePointTraversal.getResult();

//
// Step 2
// Partially extract DLLs from results
//
console.log('- Searching for .dll files\n');

const dllTraversal = new TermTraversal(/\.dll$/i, sharepointTargets);
const dlls = await dllTraversal.getResult();

//
// Step 3
// Copy DLLs to destination path
//
const duplicates = new Set();
for (const itemPath of dlls) {
  const itemStat = await stat(itemPath);

  if (!itemStat.isFile()) continue;

  let itemName = basename(itemPath);
  while (duplicates.has(itemName)) {
    itemName = basename(itemName, '.dll') + `-duplicate` + '.dll';
  }

  duplicates.add(itemName);

  await copyFile(itemPath, joinPath(dest, itemName), constants.COPYFILE_FICLONE);
}

console.log('- Done!');

tty.close();

async function getPath(prompt) {
  let dest;
  while (true) {
    dest = await tty.question(prompt);

    try {
      await access(dest, constants.F_OK);
      return dest;
    } catch (e) {
      console.error('! error: path is not accessible');
    }
  }
}

/** check availability of required data for testing provided by test suit */
function assertTestData(prop, msg) {
  assert(
    isMainThread ^ (workerData != null && typeof workerData === 'object' && prop in workerData),
    msg
  );
}
