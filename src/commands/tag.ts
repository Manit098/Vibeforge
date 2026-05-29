import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { generateTimestamp } from '../utils/crypto';

export const tagCommand = (name: string) => {
  const vibeforgeDir = ensureWorkspace();
  const tagsDir = path.join(vibeforgeDir, 'tags');
  if (!fs.existsSync(tagsDir)) fs.mkdirSync(tagsDir, { recursive: true });

  const ts = generateTimestamp();
  const tagDir = path.join(tagsDir, `${name}_${ts.replace(/[:.]/g, '-')}`);
  fs.mkdirSync(tagDir, { recursive: true });

  // Snapshot context
  const contextSrc = path.join(vibeforgeDir, 'context.md');
  if (fs.existsSync(contextSrc)) {
    fs.copyFileSync(contextSrc, path.join(tagDir, 'context.md'));
  }

  // Snapshot handoff
  const handoffSrc = path.join(vibeforgeDir, 'handoff.md');
  if (fs.existsSync(handoffSrc)) {
    fs.copyFileSync(handoffSrc, path.join(tagDir, 'handoff.md'));
  }

  // Save tag metadata
  const meta = {
    name,
    timestamp: ts,
    workspace: process.cwd(),
    contextSize: fs.existsSync(contextSrc) ? fs.statSync(contextSrc).size : 0,
    handoffSize: fs.existsSync(handoffSrc) ? fs.statSync(handoffSrc).size : 0,
    docsCount: fs.existsSync(path.join(vibeforgeDir, 'docs')) ? fs.readdirSync(path.join(vibeforgeDir, 'docs')).length : 0,
    memoryCount: fs.existsSync(path.join(vibeforgeDir, 'memory')) ? fs.readdirSync(path.join(vibeforgeDir, 'memory')).length : 0,
    recordsCount: fs.existsSync(path.join(vibeforgeDir, 'records')) ? fs.readdirSync(path.join(vibeforgeDir, 'records')).length : 0,
  };
  fs.writeFileSync(path.join(tagDir, 'tag.json'), JSON.stringify(meta, null, 2));

  console.log(`\n🏷️  Tag Created: "${name}"\n`);
  console.log(`  📂 Location:  tags/${path.basename(tagDir)}`);
  console.log(`  ⏰ Timestamp: ${ts}`);
  console.log(`  📚 Context:   ${(meta.contextSize / 1024).toFixed(1)} KB snapshotted`);
  console.log(`  🎯 Handoff:   ${meta.handoffSize > 0 ? (meta.handoffSize / 1024).toFixed(1) + ' KB snapshotted' : 'Not available'}`);
  console.log('');
};

export const tagsListCommand = () => {
  const vibeforgeDir = ensureWorkspace();
  const tagsDir = path.join(vibeforgeDir, 'tags');

  if (!fs.existsSync(tagsDir) || fs.readdirSync(tagsDir).length === 0) {
    console.log('\n🏷️  No tags found. Create one with: vibeforge tag <name>\n');
    return;
  }

  console.log('\n🏷️  Project Tags\n');
  console.log('─'.repeat(55));

  const tags = fs.readdirSync(tagsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  tags.forEach((t) => {
    const metaPath = path.join(tagsDir, t.name, 'tag.json');
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        console.log(`  🏷️  ${meta.name}`);
        console.log(`     Created: ${meta.timestamp} | Context: ${(meta.contextSize / 1024).toFixed(1)} KB`);
        console.log(`     Docs: ${meta.docsCount} | Memory: ${meta.memoryCount} | Records: ${meta.recordsCount}`);
        console.log('');
      } catch {}
    }
  });
};
