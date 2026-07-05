import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';

export const rollbackCommand = (tagName: string) => {
  const vibeforgeDir = ensureWorkspace();
  const tagsDir = path.join(vibeforgeDir, 'tags');

  if (!fs.existsSync(tagsDir)) {
    console.error('❌ No tags found. Create tags with: vibeforge tag <name>');
    process.exit(1);
  }

  const dirs = fs.readdirSync(tagsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  const match = dirs.find((d) => d.name.startsWith(tagName));

  if (!match) {
    console.error(`❌ Tag "${tagName}" not found.`);
    console.log('\nAvailable tags:');
    dirs.forEach((d) => console.log(`  🏷️  ${d.name}`));
    process.exit(1);
  }

  const tagDir = path.join(tagsDir, match.name);
  const metaPath = path.join(tagDir, 'tag.json');
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    : { name: tagName };

  console.log(`\n⏪ Rolling back to tag: "${meta.name}"\n`);

  // Restore context.md
  const ctxSrc = path.join(tagDir, 'context.md');
  if (fs.existsSync(ctxSrc)) {
    fs.copyFileSync(ctxSrc, path.join(vibeforgeDir, 'context.md'));
    console.log('  ✅ context.md restored');
  } else {
    console.log('  ⚠️  No context.md in tag snapshot');
  }

  // Restore handoff.md
  const hoSrc = path.join(tagDir, 'handoff.md');
  if (fs.existsSync(hoSrc)) {
    fs.copyFileSync(hoSrc, path.join(vibeforgeDir, 'handoff.md'));
    console.log('  ✅ handoff.md restored');
  } else {
    console.log('  ⚠️  No handoff.md in tag snapshot');
  }

  console.log(`\n🎉 Rollback to "${meta.name}" complete.`);
  console.log(`   Tag timestamp: ${meta.timestamp || 'unknown'}\n`);
};
