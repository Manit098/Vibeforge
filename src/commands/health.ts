import path from 'path';
import fs from 'fs';
import { simpleGit } from 'simple-git';
import { ensureWorkspace } from '../utils/fs';
import { runTestScan } from './test-scan';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';

const scoreBar = (score: number, max: number = 100): string => {
  const pct = Math.round((score / max) * 20);
  const filled = '█'.repeat(pct);
  const empty = '░'.repeat(20 - pct);
  const color = score >= 80 ? GREEN : score >= 50 ? YELLOW : RED;
  return `${color}${filled}${empty}${RESET} ${score}/${max}`;
};

export const healthCommand = async () => {
  const vibeforgeDir = ensureWorkspace();
  let totalScore = 0;
  const scores: { name: string; score: number; max: number; detail: string }[] = [];

  // 1. Docs coverage (0-15)
  const docsDir = path.join(vibeforgeDir, 'docs');
  const docsCount = fs.existsSync(docsDir)
    ? fs.readdirSync(docsDir).filter((f) => f.endsWith('.md') || f.endsWith('.txt')).length
    : 0;
  const docsScore = Math.min(15, docsCount * 5);
  scores.push({
    name: '📄 Documentation',
    score: docsScore,
    max: 15,
    detail: `${docsCount} doc(s) found`,
  });

  // 2. Memory freshness (0-15)
  const memDir = path.join(vibeforgeDir, 'memory');
  const memCount = fs.existsSync(memDir) ? fs.readdirSync(memDir).length : 0;
  const memScore = Math.min(15, memCount * 3);
  scores.push({
    name: '🧠 Memory Entries',
    score: memScore,
    max: 15,
    detail: `${memCount} entries`,
  });

  // 3. Records (0-15)
  const recDir = path.join(vibeforgeDir, 'records');
  const recCount = fs.existsSync(recDir) ? fs.readdirSync(recDir).length : 0;
  const recScore = Math.min(15, recCount * 3);
  scores.push({ name: '📁 Records', score: recScore, max: 15, detail: `${recCount} records` });

  // 4. Context freshness (0-15)
  const ctxPath = path.join(vibeforgeDir, 'context.md');
  let ctxScore = 0;
  let ctxDetail = 'No context.md';
  if (fs.existsSync(ctxPath)) {
    const stat = fs.statSync(ctxPath);
    const ageHours = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60);
    if (ageHours < 1) {
      ctxScore = 15;
      ctxDetail = 'Fresh (< 1h)';
    } else if (ageHours < 6) {
      ctxScore = 12;
      ctxDetail = `${ageHours.toFixed(1)}h old`;
    } else if (ageHours < 24) {
      ctxScore = 8;
      ctxDetail = `${ageHours.toFixed(1)}h old`;
    } else {
      ctxScore = 4;
      ctxDetail = `${Math.floor(ageHours / 24)}d old — STALE`;
    }
  }
  scores.push({ name: '📚 Context Freshness', score: ctxScore, max: 15, detail: ctxDetail });

  // 5. Git hygiene (0-15)
  let gitScore = 0;
  let gitDetail = 'Not a git repo';
  try {
    const git = simpleGit();
    if (await git.checkIsRepo()) {
      const status = await git.status();
      const dirty = status.modified.length + status.not_added.length + status.created.length;
      if (dirty === 0) {
        gitScore = 15;
        gitDetail = 'Clean working tree';
      } else if (dirty <= 5) {
        gitScore = 10;
        gitDetail = `${dirty} uncommitted changes`;
      } else {
        gitScore = 5;
        gitDetail = `${dirty} uncommitted changes — messy`;
      }
    }
  } catch {}
  scores.push({ name: '🌿 Git Hygiene', score: gitScore, max: 15, detail: gitDetail });

  // 6. Handoff exists (0-10)
  const handoffPath = path.join(vibeforgeDir, 'handoff.md');
  let hoScore = 0;
  let hoDetail = 'No handoff generated';
  if (fs.existsSync(handoffPath)) {
    const stat = fs.statSync(handoffPath);
    const ageHours = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60);
    hoScore = ageHours < 6 ? 10 : ageHours < 24 ? 7 : 3;
    hoDetail = ageHours < 1 ? 'Fresh' : `${ageHours.toFixed(1)}h old`;
  }
  scores.push({ name: '🎯 Handoff State', score: hoScore, max: 10, detail: hoDetail });

  // 7. Checklist (0-5)
  const clPath = path.join(vibeforgeDir, 'checklist.md');
  let clScore = 0;
  let clDetail = 'No checklist';
  if (fs.existsSync(clPath)) {
    clScore = 5;
    clDetail = 'Active checklist';
  }
  scores.push({ name: '📋 Checklist', score: clScore, max: 5, detail: clDetail });

  // 8. Test Coverage (0-10)
  const testScanRes = runTestScan(process.cwd());
  const testScore = Math.round((testScanRes.coverageRatio / 100) * 10);
  scores.push({
    name: '🧪 Test Coverage',
    score: testScore,
    max: 10,
    detail: `${testScanRes.coverageRatio}% coverage (${testScanRes.testedCount}/${testScanRes.totalSourceFiles})`,
  });

  totalScore = scores.reduce((s, sc) => s + sc.score, 0);

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

  console.log(`\n${BOLD}🩺 VibeForge Project Health Report${RESET}\n`);
  console.log(`${BOLD}Overall Score: ${totalScore}/100  ${grade}${RESET}`);
  console.log(`${scoreBar(totalScore)}\n`);
  console.log('─'.repeat(60));

  scores.forEach((s) => {
    console.log(`  ${s.name.padEnd(25)} ${scoreBar(s.score, s.max)}  ${s.detail}`);
  });

  console.log('─'.repeat(60));

  // Recommendations
  const recs: string[] = [];
  if (docsScore < 10) recs.push('📄 Add more documentation with: vibeforge add --docs <file>');
  if (memCount === 0)
    recs.push('🧠 Record decisions with: vibeforge decision "<text>" --reason "<why>"');
  if (ctxScore < 12) recs.push('📚 Rebuild context with: vibeforge context');
  if (gitScore < 10) recs.push('🌿 Commit your changes to improve git hygiene');
  if (hoScore < 7) recs.push('🎯 Generate a fresh handoff with: vibeforge handoff');
  if (clScore === 0) recs.push('📋 Start a checklist with: vibeforge checklist "Next task"');
  if (testScore < 8)
    recs.push('🧪 Add unit tests for untested files: run "vibeforge test-scan" to see candidates');

  if (recs.length > 0) {
    console.log(`\n${BOLD}💡 Recommendations:${RESET}`);
    recs.forEach((r) => console.log(`  ${r}`));
  } else {
    console.log(`\n${GREEN}${BOLD}✨ Perfect health! Your project is well-maintained.${RESET}`);
  }
  console.log('');
};
