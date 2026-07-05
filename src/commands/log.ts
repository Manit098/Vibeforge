import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';

const typeColors: { [key: string]: string } = {
  commit: '\x1b[36m', // cyan
  prompt: '\x1b[32m', // green
  memory: '\x1b[35m', // magenta
  decision: '\x1b[35m', // magenta
  plan: '\x1b[33m', // yellow
  watcher: '\x1b[33m', // yellow
  system: '\x1b[31m', // red
};
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';

const detectType = (filename: string): string => {
  if (filename.includes('commit')) return 'commit';
  if (filename.includes('prompt')) return 'prompt';
  if (filename.includes('decision')) return 'decision';
  if (filename.includes('memory')) return 'memory';
  if (filename.includes('changes')) return 'watcher';
  if (filename.includes('plan')) return 'plan';
  return 'system';
};

interface LogOptions {
  limit?: string;
}

export const logCommand = (options: LogOptions) => {
  const vibeforgeDir = ensureWorkspace();
  const limit = parseInt(options.limit || '20', 10);

  const items: { filename: string; type: string; date: Date; preview: string; category: string }[] =
    [];

  const scanDir = (sub: string, cat: string) => {
    const dir = path.join(vibeforgeDir, sub);
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
      if (!d.isFile()) return;
      const fp = path.join(dir, d.name);
      const st = fs.statSync(fp);
      let preview = '';
      try {
        const content = fs.readFileSync(fp, 'utf-8');
        // Get first non-heading, non-empty line
        const lines = content
          .split('\n')
          .filter(
            (l) => l.trim() && !l.startsWith('#') && !l.startsWith('**') && !l.startsWith('---')
          );
        preview = (lines[0] || '').trim().substring(0, 70);
      } catch {}
      items.push({
        filename: d.name,
        type: detectType(d.name),
        date: st.mtime,
        preview,
        category: cat,
      });
    });
  };

  scanDir('records', 'record');
  scanDir('memory', 'memory');
  scanDir('plans', 'plan');

  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  console.log(`\n${BOLD}📜 VibeForge Activity Log${RESET}\n`);
  console.log(
    `${DIM}Showing ${Math.min(limit, items.length)} of ${items.length} entries${RESET}\n`
  );

  if (items.length === 0) {
    console.log('  No activity recorded yet.\n');
    return;
  }

  items.slice(0, limit).forEach((item) => {
    const color = typeColors[item.type] || '';
    const typeLabel = item.type.toUpperCase().padEnd(8);
    const dateStr = item.date.toLocaleString();
    const nameShort =
      item.filename.length > 45 ? item.filename.substring(0, 42) + '...' : item.filename;

    console.log(`  ${color}● ${typeLabel}${RESET} ${BOLD}${nameShort}${RESET}`);
    console.log(`    ${DIM}${dateStr}${RESET}`);
    if (item.preview) {
      console.log(`    ${DIM}${item.preview}${RESET}`);
    }
    console.log('');
  });
};
