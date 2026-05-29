import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';

export const compareCommand = (tag1: string, tag2: string) => {
  const vibeforgeDir = ensureWorkspace();
  const tagsDir = path.join(vibeforgeDir, 'tags');

  if (!fs.existsSync(tagsDir)) {
    console.error('❌ No tags found. Create tags first with: vibeforge tag <name>');
    process.exit(1);
  }

  const findTag = (name: string): string | null => {
    const dirs = fs.readdirSync(tagsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
    const match = dirs.find((d) => d.name.startsWith(name));
    return match ? path.join(tagsDir, match.name) : null;
  };

  const dir1 = findTag(tag1);
  const dir2 = findTag(tag2);

  if (!dir1) { console.error(`❌ Tag "${tag1}" not found.`); process.exit(1); }
  if (!dir2) { console.error(`❌ Tag "${tag2}" not found.`); process.exit(1); }

  const meta1 = JSON.parse(fs.readFileSync(path.join(dir1, 'tag.json'), 'utf-8'));
  const meta2 = JSON.parse(fs.readFileSync(path.join(dir2, 'tag.json'), 'utf-8'));

  const ctx1 = fs.existsSync(path.join(dir1, 'context.md')) ? fs.readFileSync(path.join(dir1, 'context.md'), 'utf-8') : '';
  const ctx2 = fs.existsSync(path.join(dir2, 'context.md')) ? fs.readFileSync(path.join(dir2, 'context.md'), 'utf-8') : '';

  const arrow = (a: number, b: number): string => {
    if (b > a) return `\x1b[32m↑ +${b - a}\x1b[0m`;
    if (b < a) return `\x1b[31m↓ -${a - b}\x1b[0m`;
    return '= same';
  };

  console.log(`\n📊 VibeForge Tag Comparison\n`);
  console.log('┌────────────────────┬──────────────────────┬──────────────────────┐');
  console.log(`│ Metric             │ 🏷️  ${meta1.name.padEnd(17)}│ 🏷️  ${meta2.name.padEnd(17)}│`);
  console.log('├────────────────────┼──────────────────────┼──────────────────────┤');
  console.log(`│ Timestamp          │ ${meta1.timestamp.substring(0, 19).padEnd(21)}│ ${meta2.timestamp.substring(0, 19).padEnd(21)}│`);
  console.log(`│ Context Size       │ ${((meta1.contextSize || 0) / 1024).toFixed(1).padStart(7)} KB            │ ${((meta2.contextSize || 0) / 1024).toFixed(1).padStart(7)} KB            │`);
  console.log(`│ Handoff Size       │ ${((meta1.handoffSize || 0) / 1024).toFixed(1).padStart(7)} KB            │ ${((meta2.handoffSize || 0) / 1024).toFixed(1).padStart(7)} KB            │`);
  console.log(`│ Docs               │ ${String(meta1.docsCount || 0).padStart(7)}               │ ${String(meta2.docsCount || 0).padStart(7)}               │`);
  console.log(`│ Memory             │ ${String(meta1.memoryCount || 0).padStart(7)}               │ ${String(meta2.memoryCount || 0).padStart(7)}               │`);
  console.log(`│ Records            │ ${String(meta1.recordsCount || 0).padStart(7)}               │ ${String(meta2.recordsCount || 0).padStart(7)}               │`);
  console.log('└────────────────────┴──────────────────────┴──────────────────────┘');

  console.log('\n📈 Changes:');
  console.log(`  Context:  ${arrow(meta1.contextSize || 0, meta2.contextSize || 0)} bytes`);
  console.log(`  Docs:     ${arrow(meta1.docsCount || 0, meta2.docsCount || 0)}`);
  console.log(`  Memory:   ${arrow(meta1.memoryCount || 0, meta2.memoryCount || 0)}`);
  console.log(`  Records:  ${arrow(meta1.recordsCount || 0, meta2.recordsCount || 0)}`);

  // Context diff
  const lines1 = ctx1.split('\n').length;
  const lines2 = ctx2.split('\n').length;
  console.log(`\n📝 Context Lines: ${lines1} → ${lines2} (${lines2 >= lines1 ? '+' : ''}${lines2 - lines1})`);
  console.log('');
};
