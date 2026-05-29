import path from 'path';
import fs from 'fs';
import { simpleGit } from 'simple-git';
import { ensureWorkspace } from '../utils/fs';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

const copyDir = (src: string, dest: string) => {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const items = fs.readdirSync(src, { withFileTypes: true });

  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    if (item.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const getBranchName = async (): Promise<string> => {
  try {
    const git = simpleGit();
    if (await git.checkIsRepo()) {
      const st = await git.status();
      return st.current || 'detached-head';
    }
  } catch {}
  return 'default-branch';
};

export const branchContextCommand = async (options: { save?: boolean; restore?: boolean; list?: boolean }) => {
  const vibeforgeDir = ensureWorkspace();
  const activeBranch = await getBranchName();

  console.log(`\n${BOLD}🔀 VibeForge Git Branch-Context Manager${RESET}`);
  console.log(`Active Git Branch: ${CYAN}${activeBranch}${RESET}\n`);

  const branchDir = path.join(vibeforgeDir, 'branches', encodeURIComponent(activeBranch));

  if (options.save) {
    // Save current checklist, memory, plans
    if (!fs.existsSync(branchDir)) fs.mkdirSync(branchDir, { recursive: true });

    // Checklist
    const clPath = path.join(vibeforgeDir, 'checklist.md');
    if (fs.existsSync(clPath)) {
      fs.copyFileSync(clPath, path.join(branchDir, 'checklist.md'));
    }

    // Memory
    const memDir = path.join(vibeforgeDir, 'memory');
    if (fs.existsSync(memDir)) {
      copyDir(memDir, path.join(branchDir, 'memory'));
    }

    // Plans
    const plansDir = path.join(vibeforgeDir, 'plans');
    if (fs.existsSync(plansDir)) {
      copyDir(plansDir, path.join(branchDir, 'plans'));
    }

    // Save metadata
    const meta = {
      branch: activeBranch,
      timestamp: new Date().toISOString(),
      filesSaved: {
        checklist: fs.existsSync(clPath),
        memoryCount: fs.existsSync(memDir) ? fs.readdirSync(memDir).length : 0,
        plansCount: fs.existsSync(plansDir) ? fs.readdirSync(plansDir).length : 0,
      }
    };
    fs.writeFileSync(path.join(branchDir, 'meta.json'), JSON.stringify(meta, null, 2));

    console.log(`${GREEN}✔ Snapshot context saved successfully for branch "${activeBranch}"!${RESET}`);
    console.log(`  Saved to: .vibeforge/branches/${encodeURIComponent(activeBranch)}/\n`);
    return;
  }

  if (options.restore) {
    if (!fs.existsSync(branchDir)) {
      console.log(`${RED}❌ Error: No saved context snapshot found for branch "${activeBranch}".${RESET}`);
      console.log(`   Save a snapshot first using: vibeforge branch-context --save\n`);
      return;
    }

    // Restore Checklist
    const snapCl = path.join(branchDir, 'checklist.md');
    if (fs.existsSync(snapCl)) {
      fs.copyFileSync(snapCl, path.join(vibeforgeDir, 'checklist.md'));
    }

    // Restore Memory
    const snapMem = path.join(branchDir, 'memory');
    if (fs.existsSync(snapMem)) {
      const targetMem = path.join(vibeforgeDir, 'memory');
      if (!fs.existsSync(targetMem)) fs.mkdirSync(targetMem, { recursive: true });
      copyDir(snapMem, targetMem);
    }

    // Restore Plans
    const snapPlans = path.join(branchDir, 'plans');
    if (fs.existsSync(snapPlans)) {
      const targetPlans = path.join(vibeforgeDir, 'plans');
      if (!fs.existsSync(targetPlans)) fs.mkdirSync(targetPlans, { recursive: true });
      copyDir(snapPlans, targetPlans);
    }

    const meta = JSON.parse(fs.readFileSync(path.join(branchDir, 'meta.json'), 'utf-8'));
    console.log(`${GREEN}✔ Context successfully restored for branch "${activeBranch}"!${RESET}`);
    console.log(`  Snapshot taken at: ${new Date(meta.timestamp).toLocaleString()}`);
    console.log(`  Restored checklist, ${meta.filesSaved.memoryCount} memory logs, and ${meta.filesSaved.plansCount} plans.\n`);
    return;
  }

  if (options.list) {
    const branchesParent = path.join(vibeforgeDir, 'branches');
    if (!fs.existsSync(branchesParent)) {
      console.log(`${YELLOW}No saved branch context snapshots found in this workspace.${RESET}\n`);
      return;
    }

    const snapDirs = fs.readdirSync(branchesParent).filter(d => {
      return fs.statSync(path.join(branchesParent, d)).isDirectory();
    });

    if (snapDirs.length === 0) {
      console.log(`${YELLOW}No saved branch context snapshots found in this workspace.${RESET}\n`);
      return;
    }

    console.log(`${BOLD}Saved Branch Contexts:${RESET}`);
    for (const d of snapDirs) {
      const metaPath = path.join(branchesParent, d, 'meta.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        console.log(`  • ${CYAN}${meta.branch.padEnd(25)}${RESET} [Saved: ${new Date(meta.timestamp).toLocaleString()}]`);
        console.log(`    🗂️ Checklist: ${meta.filesSaved.checklist ? 'Yes' : 'No'} | Memory count: ${meta.filesSaved.memoryCount} | Plans count: ${meta.filesSaved.plansCount}`);
      }
    }
    console.log('');
    return;
  }

  // Default: show usage
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  vibeforge branch-context --save      - Save current context state linked to active branch`);
  console.log(`  vibeforge branch-context --restore   - Restore context state from active branch snapshot`);
  console.log(`  vibeforge branch-context --list      - List all saved branch context snapshots\n`);
};
