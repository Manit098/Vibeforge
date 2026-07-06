import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { updateContext } from '../services/context';
import { isWorkspaceLocked } from './lock';

const cleanDir = (dir: string): number => {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    count++;
  }
  return count;
};

interface CleanOptions {
  records?: boolean;
  memory?: boolean;
  all?: boolean;
}

export const cleanCommand = (options: CleanOptions) => {
  const vibeforgeDir = ensureWorkspace();

  if (isWorkspaceLocked(vibeforgeDir)) {
    console.error('\n Workspace is LOCKED. Unlock first with: vibeforge unlock\n');
    process.exit(1);
  }

  if (!options.records && !options.memory && !options.all) {
    console.log('\n VibeForge Clean\n');
    console.log('Usage:');
    console.log('  vibeforge clean --records    Remove all records');
    console.log('  vibeforge clean --memory     Remove all memory entries');
    console.log('  vibeforge clean --all        Remove records, memory, and plans (keeps docs)');
    console.log('');
    return;
  }

  console.log('\n Cleaning workspace...\n');
  let totalCleaned = 0;

  if (options.records || options.all) {
    const count = cleanDir(path.join(vibeforgeDir, 'records'));
    console.log(`    Records: ${count} item(s) removed`);
    totalCleaned += count;
  }

  if (options.memory || options.all) {
    const count = cleanDir(path.join(vibeforgeDir, 'memory'));
    console.log(`    Memory: ${count} item(s) removed`);
    totalCleaned += count;
  }

  if (options.all) {
    const count = cleanDir(path.join(vibeforgeDir, 'plans'));
    console.log(`    Plans: ${count} item(s) removed`);
    totalCleaned += count;
  }

  // Regenerate context
  updateContext(vibeforgeDir);

  console.log(`\n Cleaned ${totalCleaned} total item(s). Context regenerated.\n`);
};
