import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { scanCodebase } from '../services/codegraph';

interface LangStat {
  ext: string;
  count: number;
  totalBytes: number;
}

const collectStats = (node: any, stats: LangStat[], largest: { name: string; size: number }[]) => {
  if (node.type === 'file') {
    const ext = node.extension || '(none)';
    let entry = stats.find((s) => s.ext === ext);
    if (!entry) {
      entry = { ext, count: 0, totalBytes: 0 };
      stats.push(entry);
    }
    entry.count++;
    entry.totalBytes += node.size || 0;
    largest.push({ name: node.path, size: node.size || 0 });
  }
  if (node.children) {
    for (const c of node.children) {
      collectStats(c, stats, largest);
    }
  }
};

const countNodes = (node: any): { files: number; dirs: number } => {
  if (node.type === 'file') return { files: 1, dirs: 0 };
  let files = 0,
    dirs = 1;
  if (node.children) {
    for (const c of node.children) {
      const sub = countNodes(c);
      files += sub.files;
      dirs += sub.dirs;
    }
  }
  return { files, dirs };
};

const bar = (value: number, max: number, width: number = 25): string => {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
};

export const analyzeCommand = () => {
  const cwd = process.cwd();

  console.log('\n📈 VibeForge Codebase Analysis\n');
  console.log(`Scanning: ${cwd}\n`);

  const tree = scanCodebase(cwd);
  const langStats: LangStat[] = [];
  const largest: { name: string; size: number }[] = [];

  collectStats(tree, langStats, largest);

  const { files, dirs } = countNodes(tree);

  // Sort by count
  langStats.sort((a, b) => b.count - a.count);
  largest.sort((a, b) => b.size - a.size);

  const totalFiles = langStats.reduce((s, l) => s + l.count, 0);
  const totalBytes = langStats.reduce((s, l) => s + l.totalBytes, 0);
  const totalSizeStr = totalBytes > 1048576 ? (totalBytes / 1048576).toFixed(2) + ' MB' : (totalBytes / 1024).toFixed(1) + ' KB';

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log(`│  📂 Directories: ${String(dirs).padEnd(8)} 📄 Files: ${String(files).padEnd(8)} 💾 Size: ${totalSizeStr.padEnd(10)} │`);
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  // Language breakdown
  console.log('🗂️  Language Breakdown:');
  console.log('─'.repeat(60));
  const maxCount = langStats[0]?.count || 1;
  langStats.slice(0, 15).forEach((l) => {
    const pct = ((l.count / totalFiles) * 100).toFixed(1);
    const sizeStr = l.totalBytes > 1048576 ? (l.totalBytes / 1048576).toFixed(1) + 'MB' : (l.totalBytes / 1024).toFixed(1) + 'KB';
    console.log(`  ${l.ext.padEnd(10)} ${bar(l.count, maxCount)} ${String(l.count).padStart(4)} files (${pct.padStart(5)}%) ${sizeStr.padStart(8)}`);
  });
  if (langStats.length > 15) {
    console.log(`  ... and ${langStats.length - 15} more file types`);
  }

  // Largest files
  console.log('\n📏 Top 10 Largest Files:');
  console.log('─'.repeat(60));
  largest.slice(0, 10).forEach((f, i) => {
    const rel = path.relative(cwd, f.name);
    const sizeStr = f.size > 1048576 ? (f.size / 1048576).toFixed(2) + ' MB' : (f.size / 1024).toFixed(1) + ' KB';
    console.log(`  ${String(i + 1).padStart(2)}. ${sizeStr.padStart(10)}  ${rel}`);
  });

  // Dependencies
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = Object.keys(pkg.dependencies || {});
      const devDeps = Object.keys(pkg.devDependencies || {});
      console.log(`\n📦 Dependencies: ${deps.length} production, ${devDeps.length} dev`);
      console.log('─'.repeat(60));
      if (deps.length) console.log(`  Production: ${deps.join(', ')}`);
      if (devDeps.length) console.log(`  Dev:        ${devDeps.join(', ')}`);
    } catch {}
  }

  // VibeForge workspace stats
  const vibeforgeDir = path.join(cwd, '.vibeforge');
  if (fs.existsSync(vibeforgeDir)) {
    console.log('\n🧠 Workspace Health:');
    console.log('─'.repeat(60));
    const contextPath = path.join(vibeforgeDir, 'context.md');
    if (fs.existsSync(contextPath)) {
      const ctx = fs.readFileSync(contextPath, 'utf-8');
      console.log(`  Context: ${(ctx.length / 1024).toFixed(1)} KB / ~${Math.ceil(ctx.length / 4)} tokens`);
    }
    const subdirs = ['docs', 'memory', 'records', 'plans'];
    subdirs.forEach((sub) => {
      const dir = path.join(vibeforgeDir, sub);
      if (fs.existsSync(dir)) {
        const count = fs.readdirSync(dir).length;
        console.log(`  ${sub.charAt(0).toUpperCase() + sub.slice(1)}: ${count} entries`);
      }
    });
  }

  console.log('');
};
