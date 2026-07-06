import path from 'path';
import fs from 'fs';
import { simpleGit } from 'simple-git';
import { ensureWorkspace, countFilesInDir } from '../utils/fs';
import { estimateTokens } from '../utils/crypto';

export const statusCommand = async () => {
  const vibeforgeDir = ensureWorkspace();

  const docsCount = countFilesInDir(path.join(vibeforgeDir, 'docs'));
  const memoryCount = countFilesInDir(path.join(vibeforgeDir, 'memory'));
  const plansCount = countFilesInDir(path.join(vibeforgeDir, 'plans'));
  const recordsDir = path.join(vibeforgeDir, 'records');
  const recordsCount = fs.existsSync(recordsDir) ? fs.readdirSync(recordsDir).length : 0;

  // Context stats
  let contextTokens = 0;
  let contextSize = '0 KB';
  const contextPath = path.join(vibeforgeDir, 'context.md');
  if (fs.existsSync(contextPath)) {
    const content = fs.readFileSync(contextPath, 'utf-8');
    contextTokens = estimateTokens(content);
    contextSize = (fs.statSync(contextPath).size / 1024).toFixed(1) + ' KB';
  }

  // Handoff info
  let handoffInfo = 'Never';
  const handoffPath = path.join(vibeforgeDir, 'handoff.md');
  if (fs.existsSync(handoffPath)) {
    const stat = fs.statSync(handoffPath);
    handoffInfo = stat.mtime.toLocaleString();
  }

  // Workspace size
  let totalSize = 0;
  const calcSize = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach((item) => {
      const fp = path.join(dir, item.name);
      if (item.isDirectory()) {
        calcSize(fp);
      } else {
        totalSize += fs.statSync(fp).size;
      }
    });
  };
  calcSize(vibeforgeDir);
  const totalSizeStr =
    totalSize > 1024 * 1024
      ? (totalSize / (1024 * 1024)).toFixed(2) + ' MB'
      : (totalSize / 1024).toFixed(1) + ' KB';

  // Git info
  let branch = '-';
  let lastCommit = '-';
  try {
    const git = simpleGit();
    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      const st = await git.status();
      branch = st.current || '-';
      const log = await git.log({ maxCount: 1 });
      if (log.latest) {
        lastCommit =
          log.latest.message.substring(0, 40) + (log.latest.message.length > 40 ? '...' : '');
      }
    }
  } catch {
    // Git not available
  }

  console.log('\n VibeForge Workspace Status\n');
  console.log('');
  console.log(' Property              Value                                      ');
  console.log('');
  console.log(`  Git Branch         ${branch.padEnd(42)} `);
  console.log(`  Last Commit        ${lastCommit.padEnd(42)} `);
  console.log('');
  console.log(`  Documents          ${String(docsCount).padEnd(42)} `);
  console.log(`  Memory Entries     ${String(memoryCount).padEnd(42)} `);
  console.log(`  Plans              ${String(plansCount).padEnd(42)} `);
  console.log(`  Records            ${String(recordsCount).padEnd(42)} `);
  console.log('');
  console.log(`  Context Size       ${contextSize.padEnd(42)} `);
  console.log(`  Context Tokens     ${('~' + contextTokens).padEnd(42)} `);
  console.log(`  Last Handoff       ${handoffInfo.padEnd(42)} `);
  console.log(`  Workspace Size     ${totalSizeStr.padEnd(42)} `);
  console.log('\n');
};
