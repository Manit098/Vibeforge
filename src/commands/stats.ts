import path from 'path';
import fs from 'fs';
import { simpleGit } from 'simple-git';
import { ensureWorkspace } from '../utils/fs';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface StatsOptions {
  weekly?: boolean;
}

export const statsCommand = async (options: StatsOptions) => {
  const vibeforgeDir = ensureWorkspace();
  const isWeekly = options.weekly || false;

  console.log(`\n${BOLD}📈 VibeForge Activity Stats${isWeekly ? ' (Weekly)' : ''}${RESET}\n`);

  // Git commit stats
  try {
    const git = simpleGit();
    if (await git.checkIsRepo()) {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - (isWeekly ? 7 : 1));

      const log = await git.log({ '--since': sinceDate.toISOString() });
      const period = isWeekly ? 'this week' : 'today';

      console.log(`  🌿 Commits ${period}: ${BOLD}${log.total}${RESET}`);

      if (log.total > 0 && isWeekly) {
        // Commits per day
        const dayMap: { [key: string]: number } = {};
        log.all.forEach((c) => {
          const day = new Date(c.date).toLocaleDateString('en-US', { weekday: 'short' });
          dayMap[day] = (dayMap[day] || 0) + 1;
        });
        const maxDay = Math.max(...Object.values(dayMap));
        console.log('');
        Object.entries(dayMap).forEach(([day, count]) => {
          const bar = '█'.repeat(Math.round((count / maxDay) * 20));
          console.log(`    ${day.padEnd(5)} ${bar} ${count}`);
        });
      }
      console.log('');
    }
  } catch {}

  // Workspace file stats
  const subdirs = ['records', 'memory', 'plans'];
  const periodMs = isWeekly ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - periodMs;
  const period = isWeekly ? 'this week' : 'today';

  subdirs.forEach((sub) => {
    const dir = path.join(vibeforgeDir, sub);
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile());
    const total = files.length;
    const recent = files.filter((f) => {
      const stat = fs.statSync(path.join(dir, f.name));
      return stat.mtime.getTime() > cutoff;
    }).length;

    const icon = sub === 'records' ? '📁' : sub === 'memory' ? '🧠' : '📋';
    console.log(
      `  ${icon} ${sub.charAt(0).toUpperCase() + sub.slice(1)}: ${BOLD}${recent}${RESET} new ${period} (${total} total)`
    );
  });

  // Context rebuilds (check modification time)
  const ctxPath = path.join(vibeforgeDir, 'context.md');
  if (fs.existsSync(ctxPath)) {
    const stat = fs.statSync(ctxPath);
    const ageH = ((Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60)).toFixed(1);
    console.log(`\n  📚 Last context rebuild: ${ageH}h ago`);
  }

  // Total workspace size
  let totalSize = 0;
  const calcSize = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir, { withFileTypes: true }).forEach((item) => {
      const fp = path.join(dir, item.name);
      if (item.isDirectory()) calcSize(fp);
      else totalSize += fs.statSync(fp).size;
    });
  };
  calcSize(vibeforgeDir);
  const sizeStr =
    totalSize > 1048576
      ? (totalSize / 1048576).toFixed(2) + ' MB'
      : (totalSize / 1024).toFixed(1) + ' KB';
  console.log(`  💾 Workspace size: ${BOLD}${sizeStr}${RESET}`);
  console.log('');
};
