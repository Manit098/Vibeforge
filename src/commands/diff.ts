import path from 'path';
import fs from 'fs';
import { simpleGit } from 'simple-git';
import { ensureWorkspace } from '../utils/fs';
import { estimateTokens } from '../utils/crypto';

export const diffCommand = async () => {
  const vibeforgeDir = ensureWorkspace();
  const contextPath = path.join(vibeforgeDir, 'context.md');

  if (!fs.existsSync(contextPath)) {
    console.error('❌ No context.md found. Run "vibeforge context" first.');
    process.exit(1);
  }

  const contextStats = fs.statSync(contextPath);
  const lastContextDate = contextStats.mtime;

  console.log('\n📊 VibeForge Diff Report\n');
  console.log(`Last context generated: ${lastContextDate.toLocaleString()}`);
  console.log('─'.repeat(50));

  try {
    const git = simpleGit();
    const isRepo = await git.checkIsRepo();

    if (isRepo) {
      const sinceDate = lastContextDate.toISOString();
      const log = await git.log({ '--since': sinceDate });

      if (log.total > 0) {
        console.log(`\n🔴 Context is STALE — ${log.total} commit(s) since last generation:\n`);
        log.all.forEach((c) => {
          console.log(`  ${c.hash.substring(0, 8)} │ ${c.message} (${c.author_name})`);
        });
      } else {
        console.log('\n🟢 Context is UP TO DATE — no new commits since last generation.');
      }

      const status = await git.status();
      const dirty = [...status.modified, ...status.created, ...status.deleted, ...status.not_added];
      if (dirty.length > 0) {
        console.log(`\n⚠️  ${dirty.length} uncommitted change(s):`);
        dirty.forEach((f) => console.log(`  • ${f}`));
      }
    } else {
      console.log('\nℹ️  Not a git repository — skipping commit analysis.');
    }
  } catch (err: any) {
    console.log(`\nℹ️  Git analysis skipped: ${err.message}`);
  }

  // Check workspace changes
  const subdirs = ['docs', 'memory', 'records', 'plans'];
  let newerFiles = 0;

  subdirs.forEach((sub) => {
    const dir = path.join(vibeforgeDir, sub);
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.mtime > lastContextDate) {
        newerFiles++;
      }
    });
  });

  if (newerFiles > 0) {
    console.log(`\n📁 ${newerFiles} workspace file(s) modified after last context generation.`);
    console.log('   Run "vibeforge context" to rebuild.');
  }

  const content = fs.readFileSync(contextPath, 'utf-8');
  const tokens = estimateTokens(content);
  console.log(`\n📏 Current context: ${content.length} chars / ~${tokens} tokens`);
  console.log('');
};
