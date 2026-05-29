import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { updateContext } from '../services/context';

export const checklistCommand = (text: string) => {
  const vibeforgeDir = ensureWorkspace();
  const clPath = path.join(vibeforgeDir, 'checklist.md');

  let content = '';
  if (fs.existsSync(clPath)) {
    content = fs.readFileSync(clPath, 'utf-8');
  } else {
    content = `# 📋 Project Checklist\n\n`;
  }

  const ts = new Date().toISOString().split('T')[0];
  content += `- [ ] ${text} *(added ${ts})*\n`;

  fs.writeFileSync(clPath, content);
  updateContext(vibeforgeDir);

  console.log(`\n📋 Added to checklist: "${text}"`);

  // Show current counts
  const pending = (content.match(/- \[ \]/g) || []).length;
  const done = (content.match(/- \[x\]/g) || []).length;
  console.log(`   Pending: ${pending} | Completed: ${done}`);
  console.log(`   View full list: vibeforge checklist-show\n`);
};

export const checklistShowCommand = () => {
  const vibeforgeDir = ensureWorkspace();
  const clPath = path.join(vibeforgeDir, 'checklist.md');

  if (!fs.existsSync(clPath)) {
    console.log('\n📋 No checklist found. Create one with: vibeforge checklist "Task description"\n');
    return;
  }

  const content = fs.readFileSync(clPath, 'utf-8');
  const pending = (content.match(/- \[ \]/g) || []).length;
  const done = (content.match(/- \[x\]/g) || []).length;

  console.log(`\n${content}`);
  console.log(`─────────────────────────────────`);
  console.log(`  ⬜ Pending: ${pending}  ✅ Completed: ${done}  📊 Total: ${pending + done}\n`);
};

export const checklistDoneCommand = (index: string) => {
  const vibeforgeDir = ensureWorkspace();
  const clPath = path.join(vibeforgeDir, 'checklist.md');

  if (!fs.existsSync(clPath)) {
    console.error('❌ No checklist found.');
    process.exit(1);
  }

  let content = fs.readFileSync(clPath, 'utf-8');
  const lines = content.split('\n');
  const idx = parseInt(index);

  let taskCount = 0;
  let targetLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^- \[ \]/)) {
      taskCount++;
      if (taskCount === idx) {
        targetLine = i;
        break;
      }
    }
  }

  if (targetLine === -1) {
    console.error(`❌ Task #${idx} not found.`);
    process.exit(1);
  }

  lines[targetLine] = lines[targetLine].replace('- [ ]', '- [x]');
  fs.writeFileSync(clPath, lines.join('\n'));
  updateContext(vibeforgeDir);

  console.log(`\n✅ Completed task #${idx}: ${lines[targetLine].replace('- [x] ', '').trim()}\n`);
};
