import { join as joinPath, basename } from 'node:path';
import TermTraversal from './lib/TermTraversal.js';
import { createInterface } from 'node:readline/promises';
import { copyFile, stat, constants, access } from 'node:fs/promises';

console.log('This program should run as root/administrator');
console.log('Press ^C to exit program at any time\n');

const tty = createInterface(process.stdin, process.stdout);

//
// Step 1
// Traverse and search for directories including sharepoint term
//
const root = await getPath('? Enter root directory to search: ');
const dest = await getPath('? Enter destination of .dll files: ');

console.log('- Searching, This might take a couple of minutes...');

const sharePointTraversal = new TermTraversal(/sharepoint/i, [root]);
const sharepointTargets = await sharePointTraversal.getResult();

console.log(`- Found ${sharepointTargets.length} search result`);

//
// Step 2
// Partially extract DLLs from results
//
console.log('- Searching for .dll files');

const dllTraversal = new TermTraversal(/\.dll$/i, sharepointTargets);
const dlls = await dllTraversal.getResult();

console.log(`- Copying ${dlls.length} items`);
//
// Step 3
// Copy DLLs to destination path
//
const duplicates = new Set();
for (const itemPath of dlls) {
  const itemStat = await stat(itemPath);

  if (!itemStat.isFile()) continue;

  let itemName = basename(itemPath);
  if (duplicates.has(itemName)) {
    itemName = basename(itemName, '.dll') + '-duplicate' + '.dll';
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
      access(dest, constants.F_OK);
      return dest;
    } catch (e) {
      console.error('! error: path is not accessible');
    }
  }
}
