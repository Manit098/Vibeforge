import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';

export const inboxCommand = () => {
  const vibeforgeDir = ensureWorkspace();
  const items: { icon: string; priority: string; message: string; color: string }[] = [];

  // Check context staleness
  const ctxPath = path.join(vibeforgeDir, 'context.md');
  if (!fs.existsSync(ctxPath)) {
    items.push({
      icon: '📚',
      priority: 'HIGH',
      message: 'No context.md found — run: vibeforge context',
      color: RED,
    });
  } else {
    const age = (Date.now() - fs.statSync(ctxPath).mtime.getTime()) / (1000 * 60 * 60);
    if (age > 24)
      items.push({
        icon: '📚',
        priority: 'HIGH',
        message: `Context is ${Math.floor(age)}h old — run: vibeforge context`,
        color: RED,
      });
    else if (age > 6)
      items.push({
        icon: '📚',
        priority: 'MED',
        message: `Context is ${age.toFixed(1)}h old — consider rebuilding`,
        color: YELLOW,
      });
  }

  // Check handoff
  const hoPath = path.join(vibeforgeDir, 'handoff.md');
  if (!fs.existsSync(hoPath)) {
    items.push({
      icon: '🎯',
      priority: 'MED',
      message: 'No handoff generated — run: vibeforge handoff',
      color: YELLOW,
    });
  } else {
    const age = (Date.now() - fs.statSync(hoPath).mtime.getTime()) / (1000 * 60 * 60);
    if (age > 24)
      items.push({
        icon: '🎯',
        priority: 'MED',
        message: `Handoff is ${Math.floor(age)}h old — consider regenerating`,
        color: YELLOW,
      });
  }

  // Check docs
  const docsDir = path.join(vibeforgeDir, 'docs');
  const docsCount = fs.existsSync(docsDir) ? fs.readdirSync(docsDir).length : 0;
  if (docsCount === 0)
    items.push({
      icon: '📄',
      priority: 'HIGH',
      message: 'No docs found — add docs with: vibeforge add --docs <file>',
      color: RED,
    });
  else if (docsCount < 3)
    items.push({
      icon: '📄',
      priority: 'LOW',
      message: `Only ${docsCount} doc(s) — consider adding more project documentation`,
      color: GREEN,
    });

  // Check memory
  const memDir = path.join(vibeforgeDir, 'memory');
  const memCount = fs.existsSync(memDir) ? fs.readdirSync(memDir).length : 0;
  if (memCount === 0)
    items.push({
      icon: '🧠',
      priority: 'MED',
      message: 'No memory entries — record decisions with: vibeforge decision',
      color: YELLOW,
    });

  // Check checklist
  const clPath = path.join(vibeforgeDir, 'checklist.md');
  if (fs.existsSync(clPath)) {
    const content = fs.readFileSync(clPath, 'utf-8');
    const pending = (content.match(/- \[ \]/g) || []).length;
    const completed = (content.match(/- \[x\]/g) || []).length;
    if (pending > 0)
      items.push({
        icon: '📋',
        priority: 'MED',
        message: `${pending} pending task(s) in checklist (${completed} completed)`,
        color: YELLOW,
      });
  }

  // Check plans
  const plansDir = path.join(vibeforgeDir, 'plans');
  const plansCount = fs.existsSync(plansDir) ? fs.readdirSync(plansDir).length : 0;
  if (plansCount === 0)
    items.push({
      icon: '📋',
      priority: 'LOW',
      message: 'No plans created yet — organize with: vibeforge add --plans <file>',
      color: GREEN,
    });

  // Check for large context
  if (fs.existsSync(ctxPath)) {
    const size = fs.statSync(ctxPath).size;
    if (size > 50000)
      items.push({
        icon: '⚠️',
        priority: 'MED',
        message: `Context is ${(size / 1024).toFixed(0)}KB — may be too large for some AI models`,
        color: YELLOW,
      });
  }

  console.log(`\n${BOLD}📬 VibeForge Inbox${RESET}\n`);

  if (items.length === 0) {
    console.log(`  ${GREEN}${BOLD}✨ All clear! No pending actions.${RESET}\n`);
    return;
  }

  console.log(`  ${items.length} item(s) need attention:\n`);
  console.log('─'.repeat(60));

  // Sort by priority
  const order: { [key: string]: number } = { HIGH: 0, MED: 1, LOW: 2 };
  items.sort((a, b) => order[a.priority] - order[b.priority]);

  items.forEach((item) => {
    const tag =
      item.priority === 'HIGH'
        ? `${RED}[HIGH]${RESET}`
        : item.priority === 'MED'
          ? `${YELLOW}[MED]${RESET}`
          : `${GREEN}[LOW]${RESET}`;
    console.log(`  ${item.icon} ${tag} ${item.message}`);
  });
  console.log('─'.repeat(60));
  console.log(`\n  Run ${BOLD}vibeforge sync${RESET} to fix most issues automatically.\n`);
};
