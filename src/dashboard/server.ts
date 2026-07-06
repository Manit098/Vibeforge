import express from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { simpleGit } from 'simple-git';
import { overviewPage } from './pages/overview';
import { timelinePage } from './pages/timeline';
import { contextPage } from './pages/context';
import { documentsPage } from './pages/documents';
import { handoffPage } from './pages/handoff';
import { analyticsPage } from './pages/analytics';
import { codegraphPage } from './pages/codegraph';
import { healthPage } from './pages/health';
import { checklistPage } from './pages/checklist';
import { runTestScan } from '../commands/test-scan';
import { updateContext } from '../services/context';
import { generateHandoff } from '../services/handoff';
import { scanCodebase } from '../services/codegraph';
import { CodegraphNode } from '../types';
import { VIBEFORGE_VERSION } from '../version';

interface TimelineItem {
  filename: string;
  category: string;
  type: string;
  createdAt: string;
  sizeBytes: number;
  content: string;
}

interface DocumentSummary {
  filename: string;
  category: string;
  createdAt: string;
  sizeBytes: number;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const safeWorkspaceFile = (
  vibeforgeDir: string,
  category: string,
  filename: string
): string | undefined => {
  const allowedCategories = new Set(['docs', 'memory', 'records', 'plans']);
  if (!allowedCategories.has(category)) {
    return undefined;
  }

  if (filename !== path.basename(filename)) {
    return undefined;
  }

  const baseDir = path.resolve(vibeforgeDir, category);
  const resolved = path.resolve(baseDir, filename);
  if (resolved !== path.join(baseDir, filename)) {
    return undefined;
  }

  return resolved;
};

export const startDashboardServer = (vibeforgeDir: string, port: number = 3000) => {
  const app = express();
  app.use(express.json());

  // ─── Helper ───
  const readFiles = (subdir: string) => {
    const dir = path.join(vibeforgeDir, subdir);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => {
        const fp = path.join(dir, d.name);
        const st = fs.statSync(fp);
        return {
          filename: d.name,
          category: subdir,
          createdAt: st.mtime.toISOString(),
          sizeBytes: st.size,
        };
      });
  };

  // ─── API: Status ───
  app.get('/api/status', async (_req, res) => {
    try {
      let gitBranch = '—';
      let gitCommitsTotal = 0;
      try {
        const git = simpleGit();
        if (await git.checkIsRepo()) {
          const st = await git.status();
          gitBranch = st.current || '—';
          gitCommitsTotal = (await git.log()).total;
        }
      } catch {}
      res.json({
        projectName: path.basename(process.cwd()),
        workspacePath: process.cwd(),
        gitBranch,
        gitCommitsTotal,
        counts: {
          docs: readFiles('docs').length,
          memory: readFiles('memory').length,
          records: fs.existsSync(path.join(vibeforgeDir, 'records'))
            ? fs.readdirSync(path.join(vibeforgeDir, 'records')).length
            : 0,
          plans: readFiles('plans').length,
        },
      });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── API: Timeline ───
  app.get('/api/timeline', (_req, res) => {
    try {
      const items: TimelineItem[] = [];
      const addItems = (subdir: string, category: string, typeDetect: (f: string) => string) => {
        const dir = path.join(vibeforgeDir, subdir);
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
          if (!d.isFile()) return;
          const fp = path.join(dir, d.name);
          const st = fs.statSync(fp);
          const content = fs.readFileSync(fp, 'utf-8');
          items.push({
            filename: d.name,
            category,
            type: typeDetect(d.name),
            createdAt: st.mtime.toISOString(),
            sizeBytes: st.size,
            content: content.substring(0, 500),
          });
        });
      };
      addItems('records', 'Record', (f) => {
        if (f.includes('commit')) return 'commit';
        if (f.includes('prompt')) return 'prompt';
        if (f.includes('changes')) return 'watcher';
        return 'system';
      });
      addItems('memory', 'Memory', (f) => {
        if (f.includes('decision')) return 'memory';
        return 'memory';
      });
      addItems('plans', 'Plan', () => 'plan');
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── API: Context ───
  app.get('/api/context', (_req, res) => {
    const fp = path.join(vibeforgeDir, 'context.md');
    if (fs.existsSync(fp)) {
      res.json({ content: fs.readFileSync(fp, 'utf-8') });
    } else {
      res.status(404).json({ error: 'context.md not found' });
    }
  });

  app.post('/api/rebuild-context', (_req, res) => {
    try {
      updateContext(vibeforgeDir, { silent: true });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── API: Memory ───
  app.post('/api/memory', (req, res) => {
    try {
      const { text } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'Text required' });
      const memDir = path.join(vibeforgeDir, 'memory');
      if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });
      const id = randomUUID().split('-')[0];
      const ts = new Date().toISOString();
      const fn = `memory_${id}_${ts.replace(/[:.]/g, '-')}.md`;
      fs.writeFileSync(
        path.join(memDir, fn),
        `# Memory Entry\n\n**ID:** ${id}\n**Timestamp:** ${ts}\n**Text:**\n\n${text}\n`
      );
      updateContext(vibeforgeDir, { silent: true });
      res.json({ success: true, filename: fn });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── API: Documents ───
  app.get('/api/docs', (req, res) => {
    try {
      const cat = (req.query.category as string) || 'all';
      const categories = cat === 'all' ? ['docs', 'memory', 'records', 'plans'] : [cat];
      let all: DocumentSummary[] = [];
      categories.forEach((c) => {
        const dir = path.join(vibeforgeDir, c);
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
          if (!d.isFile()) return;
          const fp = path.join(dir, d.name);
          const st = fs.statSync(fp);
          all.push({
            filename: d.name,
            category: c,
            createdAt: st.mtime.toISOString(),
            sizeBytes: st.size,
          });
        });
      });
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(all);
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.get('/api/docs/:category/:filename', (req, res) => {
    try {
      const fp = safeWorkspaceFile(vibeforgeDir, req.params.category, req.params.filename);
      if (!fp) return res.status(400).json({ error: 'Invalid document path' });
      if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
      res.json({ content: fs.readFileSync(fp, 'utf-8') });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── API: Handoff ───
  app.get('/api/handoff', (_req, res) => {
    const fp = path.join(vibeforgeDir, 'handoff.md');
    if (fs.existsSync(fp)) {
      const st = fs.statSync(fp);
      res.json({ content: fs.readFileSync(fp, 'utf-8'), lastModified: st.mtime.toISOString() });
    } else {
      res.json({ content: '', lastModified: null });
    }
  });

  app.post('/api/handoff/generate', async (_req, res) => {
    try {
      await generateHandoff(vibeforgeDir, { silent: true });
      const fp = path.join(vibeforgeDir, 'handoff.md');
      const content = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : '';
      res.json({ success: true, content });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── API: Analytics ───
  app.get('/api/analytics', (_req, res) => {
    try {
      const tree = scanCodebase(process.cwd());

      interface LangStat {
        ext: string;
        count: number;
        totalBytes: number;
      }
      const stats: LangStat[] = [];
      const largest: { name: string; size: number }[] = [];

      const collect = (node: CodegraphNode) => {
        if (node.type === 'file') {
          const ext = node.extension || '(none)';
          let entry = stats.find((s) => s.ext === ext);
          if (!entry) {
            entry = { ext, count: 0, totalBytes: 0 };
            stats.push(entry);
          }
          entry.count++;
          entry.totalBytes += node.size || 0;
          largest.push({ name: path.relative(process.cwd(), node.path), size: node.size || 0 });
        }
        if (node.children) node.children.forEach(collect);
      };
      collect(tree);

      const countNodes = (node: CodegraphNode): { files: number; dirs: number } => {
        if (node.type === 'file') return { files: 1, dirs: 0 };
        let f = 0,
          d = 1;
        if (node.children)
          node.children.forEach((c) => {
            const s = countNodes(c);
            f += s.files;
            d += s.dirs;
          });
        return { files: f, dirs: d };
      };

      const { files: totalFiles, dirs: totalDirs } = countNodes(tree);
      stats.sort((a, b) => b.count - a.count);
      largest.sort((a, b) => b.size - a.size);

      // Dependencies
      let dependencies = null;
      const pkgPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          dependencies = {
            production: Object.keys(pkg.dependencies || {}),
            dev: Object.keys(pkg.devDependencies || {}),
          };
        } catch {}
      }

      // Workspace growth — group memory/records by date
      const growth: { [key: string]: number } = {};
      ['records', 'memory', 'plans'].forEach((sub) => {
        const dir = path.join(vibeforgeDir, sub);
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach((f) => {
          const fp = path.join(dir, f);
          const st = fs.statSync(fp);
          const dateKey = st.mtime.toISOString().split('T')[0];
          growth[dateKey] = (growth[dateKey] || 0) + 1;
        });
      });
      const workspaceGrowth = Object.keys(growth)
        .sort()
        .map((d) => ({ date: d, count: growth[d] }));

      res.json({
        totalFiles,
        totalDirs,
        totalBytes: stats.reduce((s, l) => s + l.totalBytes, 0),
        languages: stats.slice(0, 20),
        largest: largest.slice(0, 15),
        dependencies,
        workspaceGrowth,
      });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── API: Codegraph ───
  app.get('/api/codegraph', (_req, res) => {
    try {
      const tree = scanCodebase(process.cwd());
      res.json(tree);
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── API: Health ───
  app.get('/api/health', async (_req, res) => {
    try {
      const dimensions: { name: string; score: number; max: number; detail: string }[] = [];

      // Docs (0-15)
      const docsDir = path.join(vibeforgeDir, 'docs');
      const docsCount = fs.existsSync(docsDir)
        ? fs.readdirSync(docsDir).filter((f) => f.endsWith('.md') || f.endsWith('.txt')).length
        : 0;
      dimensions.push({
        name: '📄 Documentation',
        score: Math.min(15, docsCount * 5),
        max: 15,
        detail: `${docsCount} doc(s)`,
      });

      // Memory (0-15)
      const memDir = path.join(vibeforgeDir, 'memory');
      const memCount = fs.existsSync(memDir) ? fs.readdirSync(memDir).length : 0;
      dimensions.push({
        name: '🧠 Memory',
        score: Math.min(15, memCount * 3),
        max: 15,
        detail: `${memCount} entries`,
      });

      // Records (0-15)
      const recDir = path.join(vibeforgeDir, 'records');
      const recCount = fs.existsSync(recDir) ? fs.readdirSync(recDir).length : 0;
      dimensions.push({
        name: '📁 Records',
        score: Math.min(15, recCount * 3),
        max: 15,
        detail: `${recCount} records`,
      });

      // Context freshness (0-15)
      const ctxPath = path.join(vibeforgeDir, 'context.md');
      let ctxScore = 0,
        ctxDetail = 'No context.md';
      if (fs.existsSync(ctxPath)) {
        const ageH = (Date.now() - fs.statSync(ctxPath).mtime.getTime()) / 3600000;
        if (ageH < 1) {
          ctxScore = 15;
          ctxDetail = 'Fresh (< 1h)';
        } else if (ageH < 6) {
          ctxScore = 12;
          ctxDetail = `${ageH.toFixed(1)}h old`;
        } else if (ageH < 24) {
          ctxScore = 8;
          ctxDetail = `${ageH.toFixed(1)}h old`;
        } else {
          ctxScore = 4;
          ctxDetail = `${Math.floor(ageH / 24)}d old — STALE`;
        }
      }
      dimensions.push({ name: '📚 Context', score: ctxScore, max: 15, detail: ctxDetail });

      // Git (0-15)
      let gitScore = 0,
        gitDetail = 'Not a git repo';
      try {
        const git = simpleGit();
        if (await git.checkIsRepo()) {
          const st = await git.status();
          const dirty = st.modified.length + st.not_added.length + st.created.length;
          if (dirty === 0) {
            gitScore = 15;
            gitDetail = 'Clean';
          } else if (dirty <= 5) {
            gitScore = 10;
            gitDetail = `${dirty} uncommitted`;
          } else {
            gitScore = 5;
            gitDetail = `${dirty} uncommitted`;
          }
        }
      } catch {}
      dimensions.push({ name: '🌿 Git Hygiene', score: gitScore, max: 15, detail: gitDetail });

      // Handoff (0-10)
      const hoPath = path.join(vibeforgeDir, 'handoff.md');
      let hoScore = 0,
        hoDetail = 'No handoff';
      if (fs.existsSync(hoPath)) {
        const ageH = (Date.now() - fs.statSync(hoPath).mtime.getTime()) / 3600000;
        hoScore = ageH < 6 ? 10 : ageH < 24 ? 7 : 3;
        hoDetail = ageH < 1 ? 'Fresh' : `${ageH.toFixed(1)}h old`;
      }
      dimensions.push({ name: '🎯 Handoff', score: hoScore, max: 10, detail: hoDetail });

      // Checklist (0-5)
      const clPath = path.join(vibeforgeDir, 'checklist.md');
      dimensions.push({
        name: '📋 Checklist',
        score: fs.existsSync(clPath) ? 5 : 0,
        max: 5,
        detail: fs.existsSync(clPath) ? 'Active' : 'None',
      });

      // Test Coverage (0-10)
      const testScanRes = runTestScan(process.cwd());
      const testScore = Math.round((testScanRes.coverageRatio / 100) * 10);
      dimensions.push({
        name: '🧪 Test Coverage',
        score: testScore,
        max: 10,
        detail: `${testScanRes.coverageRatio}% coverage (${testScanRes.testedCount}/${testScanRes.totalSourceFiles})`,
      });

      const totalScore = dimensions.reduce((s, d) => s + d.score, 0);
      const grade =
        totalScore >= 90
          ? '🏆 A+'
          : totalScore >= 80
            ? '🥇 A'
            : totalScore >= 70
              ? '🥈 B'
              : totalScore >= 60
                ? '🥉 C'
                : totalScore >= 40
                  ? '⚠️ D'
                  : '❌ F';

      const recs: string[] = [];
      if (docsCount < 3) recs.push('Add more docs: vibeforge add --docs <file>');
      if (memCount === 0) recs.push('Record decisions: vibeforge decision "<text>"');
      if (ctxScore < 12) recs.push('Rebuild context: vibeforge context');
      if (gitScore < 10) recs.push('Commit changes to improve git hygiene');
      if (hoScore < 7) recs.push('Generate handoff: vibeforge handoff');
      if (!fs.existsSync(clPath)) recs.push('Start checklist: vibeforge checklist "Task"');
      if (testScore < 8) recs.push('Add unit tests: run "vibeforge test-scan" to see candidates');

      res.json({ totalScore, grade, dimensions, recommendations: recs });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── API: Test Scan ───
  app.get('/api/test-scan', (_req, res) => {
    try {
      const resData = runTestScan(process.cwd());
      res.json(resData);
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── API: Checklist ───
  app.get('/api/checklist', (_req, res) => {
    try {
      const clPath = path.join(vibeforgeDir, 'checklist.md');
      if (!fs.existsSync(clPath)) {
        res.json({ tasks: [] });
        return;
      }
      const content = fs.readFileSync(clPath, 'utf-8');
      const lines = content.split('\n');
      const tasks: { text: string; done: boolean; date: string }[] = [];
      lines.forEach((line) => {
        const pendingMatch = line.match(/^- \[ \] (.+?)(?:\s*\*\(added (.+?)\)\*)?$/);
        const doneMatch = line.match(/^- \[x\] (.+?)(?:\s*\*\(added (.+?)\)\*)?$/);
        if (pendingMatch)
          tasks.push({ text: pendingMatch[1].trim(), done: false, date: pendingMatch[2] || '' });
        if (doneMatch)
          tasks.push({ text: doneMatch[1].trim(), done: true, date: doneMatch[2] || '' });
      });
      res.json({ tasks });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.post('/api/checklist', (req, res) => {
    try {
      const { text } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'Text required' });
      const clPath = path.join(vibeforgeDir, 'checklist.md');
      let content = fs.existsSync(clPath)
        ? fs.readFileSync(clPath, 'utf-8')
        : '# 📋 Project Checklist\n\n';
      const ts = new Date().toISOString().split('T')[0];
      content += `- [ ] ${text} *(added ${ts})*\n`;
      fs.writeFileSync(clPath, content);
      updateContext(vibeforgeDir, { silent: true });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.post('/api/checklist/toggle/:index', (req, res) => {
    try {
      const clPath = path.join(vibeforgeDir, 'checklist.md');
      if (!fs.existsSync(clPath)) return res.status(404).json({ error: 'No checklist' });
      let content = fs.readFileSync(clPath, 'utf-8');
      const lines = content.split('\n');
      const idx = parseInt(req.params.index);
      let taskCount = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^- \[ \]/) || lines[i].match(/^- \[x\]/)) {
          taskCount++;
          if (taskCount === idx) {
            if (lines[i].startsWith('- [ ]')) lines[i] = lines[i].replace('- [ ]', '- [x]');
            else lines[i] = lines[i].replace('- [x]', '- [ ]');
            break;
          }
        }
      }
      fs.writeFileSync(clPath, lines.join('\n'));
      updateContext(vibeforgeDir, { silent: true });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.post('/api/checklist/clear-done', (_req, res) => {
    try {
      const clPath = path.join(vibeforgeDir, 'checklist.md');
      if (!fs.existsSync(clPath)) return res.status(404).json({ error: 'No checklist' });
      let content = fs.readFileSync(clPath, 'utf-8');
      const lines = content.split('\n').filter((l) => !l.match(/^- \[x\]/));
      fs.writeFileSync(clPath, lines.join('\n'));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  // ─── Page routes ───
  app.get('/', (_req, res) => res.send(overviewPage()));
  app.get('/timeline', (_req, res) => res.send(timelinePage()));
  app.get('/context', (_req, res) => res.send(contextPage()));
  app.get('/documents', (_req, res) => res.send(documentsPage()));
  app.get('/handoff', (_req, res) => res.send(handoffPage()));
  app.get('/analytics', (_req, res) => res.send(analyticsPage()));
  app.get('/codegraph', (_req, res) => res.send(codegraphPage()));
  app.get('/health', (_req, res) => res.send(healthPage()));
  app.get('/checklist', (_req, res) => res.send(checklistPage()));

  // ─── Start ───
  const server = app.listen(port, () => {
    console.log(`\n${'\u2550'.repeat(54)}`);
    console.log(`\ud83d\ude80 VibeForge Dashboard v${VIBEFORGE_VERSION}`);
    console.log(`\ud83c\udf10 http://localhost:${port}`);
    console.log(`${'\u2550'.repeat(54)}\n`);
    console.log(`Pages:`);
    console.log(`  \ud83d\udcca Overview    \u2192 http://localhost:${port}/`);
    console.log(`  \ud83d\udd50 Timeline    \u2192 http://localhost:${port}/timeline`);
    console.log(`  \ud83d\udcda Context     \u2192 http://localhost:${port}/context`);
    console.log(`  \ud83d\udcc4 Documents   \u2192 http://localhost:${port}/documents`);
    console.log(`  \ud83d\udcc8 Analytics   \u2192 http://localhost:${port}/analytics`);
    console.log(`  \ud83c\udf33 Codegraph   \u2192 http://localhost:${port}/codegraph`);
    console.log(`  \ud83e\ude7a Health      \u2192 http://localhost:${port}/health`);
    console.log(`  \ud83d\udccb Checklist   \u2192 http://localhost:${port}/checklist`);
    console.log(`  \ud83c\udfaf Handoff     \u2192 http://localhost:${port}/handoff`);
    console.log(`\n\ud83d\udd14 Live reload: auto-refreshes every 15s`);
    console.log(`\ud83c\udfa8 Theme toggle: switch dark/light in the header`);
    console.log('');
  });
  return server;
};
