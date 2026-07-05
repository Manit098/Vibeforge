import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';

export const lockCommand = () => {
  const vibeforgeDir = ensureWorkspace();
  const lockFile = path.join(vibeforgeDir, '.lock');

  if (fs.existsSync(lockFile)) {
    console.log('\n🔐 Workspace is already locked.\n');
    return;
  }

  fs.writeFileSync(
    lockFile,
    JSON.stringify(
      { lockedAt: new Date().toISOString(), lockedBy: process.env.USERNAME || 'unknown' },
      null,
      2
    )
  );
  console.log('\n🔐 Workspace LOCKED — clean and delete operations are now blocked.');
  console.log('   Unlock with: vibeforge unlock\n');
};

export const unlockCommand = () => {
  const vibeforgeDir = ensureWorkspace();
  const lockFile = path.join(vibeforgeDir, '.lock');

  if (!fs.existsSync(lockFile)) {
    console.log('\n🔓 Workspace is already unlocked.\n');
    return;
  }

  fs.unlinkSync(lockFile);
  console.log('\n🔓 Workspace UNLOCKED — all operations are now permitted.\n');
};

export const isWorkspaceLocked = (vibeforgeDir: string): boolean => {
  return fs.existsSync(path.join(vibeforgeDir, '.lock'));
};
