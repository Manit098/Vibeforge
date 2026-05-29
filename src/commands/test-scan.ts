import path from 'path';
import fs from 'fs';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

export interface TestScanResult {
  coverageRatio: number;
  totalSourceFiles: number;
  testedCount: number;
  untestedCount: number;
  testedFiles: { relativePath: string; testFile: string }[];
  untestedFiles: string[];
}

// Allowed extensions for source files
const SRC_EXTS = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.java', '.rs', '.c', '.cpp'];
// Excluded directory names
const EXCLUDED_DIRS = ['node_modules', '.git', '.vibeforge', 'dist', 'build', 'out', 'coverage', 'temp', 'tmp'];

/**
 * Recursively scans directory for source files
 */
const findSourceFiles = (dir: string, baseDir: string, filesList: string[]) => {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (EXCLUDED_DIRS.includes(item.name)) continue;
      findSourceFiles(fullPath, baseDir, filesList);
    } else {
      const ext = path.extname(item.name).toLowerCase();
      // Skip type definitions or test files themselves
      if (item.name.endsWith('.d.ts')) continue;
      
      // Check if it's a test file
      const nameLower = item.name.toLowerCase();
      if (
        nameLower.includes('.test.') || 
        nameLower.includes('.spec.') || 
        dir.split(path.sep).includes('__tests__') ||
        dir.split(path.sep).includes('tests')
      ) {
        continue;
      }

      if (SRC_EXTS.includes(ext)) {
        filesList.push(path.relative(baseDir, fullPath));
      }
    }
  }
};

/**
 * Performs a comprehensive test scan on the workspace
 */
export const runTestScan = (workspaceRoot: string): TestScanResult => {
  const sourceFiles: string[] = [];
  findSourceFiles(workspaceRoot, workspaceRoot, sourceFiles);

  const testedFiles: { relativePath: string; testFile: string }[] = [];
  const untestedFiles: string[] = [];

  for (const file of sourceFiles) {
    const dir = path.dirname(file);
    const ext = path.extname(file);
    const base = path.basename(file, ext);

    // Potential test files check list
    const candidateTests = [
      path.join(dir, `${base}.test${ext}`),
      path.join(dir, `${base}.spec${ext}`),
      path.join(dir, '__tests__', `${base}${ext}`),
      path.join(dir, '__tests__', `${base}.test${ext}`),
      path.join(dir, '__tests__', `${base}.spec${ext}`),
      path.join('tests', dir, `${base}.test${ext}`),
      path.join('tests', dir, `${base}.spec${ext}`),
      path.join('test', dir, `${base}.test${ext}`),
      path.join('test', dir, `${base}.spec${ext}`),
    ];

    let foundTest = '';
    for (const cand of candidateTests) {
      const fullCandPath = path.join(workspaceRoot, cand);
      if (fs.existsSync(fullCandPath)) {
        foundTest = cand;
        break;
      }
    }

    if (foundTest) {
      testedFiles.push({ relativePath: file, testFile: foundTest });
    } else {
      untestedFiles.push(file);
    }
  }

  const totalSourceFiles = sourceFiles.length;
  const testedCount = testedFiles.length;
  const untestedCount = untestedFiles.length;
  const coverageRatio = totalSourceFiles > 0 ? Math.round((testedCount / totalSourceFiles) * 100) : 100;

  return {
    coverageRatio,
    totalSourceFiles,
    testedCount,
    untestedCount,
    testedFiles,
    untestedFiles,
  };
};

export const testScanCommand = () => {
  const workspaceRoot = process.cwd();
  console.log(`\n${BOLD}🧪 VibeForge Test Coverage Scanner${RESET}`);
  console.log(`Scanning: ${workspaceRoot}...\n`);

  const results = runTestScan(workspaceRoot);

  const color = results.coverageRatio >= 80 ? GREEN : results.coverageRatio >= 50 ? YELLOW : RED;
  
  // Custom progress bar
  const pct = Math.round(results.coverageRatio / 5);
  const filled = '█'.repeat(pct);
  const empty = '░'.repeat(20 - pct);
  console.log(`${BOLD}Test Health Score:${RESET} ${color}${results.coverageRatio}%${RESET}`);
  console.log(`${color}${filled}${empty}${RESET}\n`);

  console.log(`  • Total Source Modules: ${results.totalSourceFiles}`);
  console.log(`  • Tested Modules:       ${GREEN}${results.testedCount}${RESET}`);
  console.log(`  • Untested Modules:     ${RED}${results.untestedCount}${RESET}\n`);

  if (results.untestedFiles.length > 0) {
    console.log(`${BOLD}⚠️  Untested Modules (Action Required):${RESET}`);
    results.untestedFiles.slice(0, 10).forEach(f => {
      console.log(`  ${RED}✗${RESET} ${f}`);
    });
    if (results.untestedFiles.length > 10) {
      console.log(`  ... and ${results.untestedFiles.length - 10} more files`);
    }

    console.log(`\n${BOLD}💡 Quick Test Scaffolding Suggestion:${RESET}`);
    const firstUntested = results.untestedFiles[0];
    const ext = path.extname(firstUntested);
    const base = path.basename(firstUntested, ext);
    const testFp = path.join(path.dirname(firstUntested), `${base}.test${ext}`);
    console.log(`  To cover ${BOLD}${firstUntested}${RESET}, create a test file:`);
    console.log(`  ${CYAN}→ ${testFp}${RESET}\n`);
  } else {
    console.log(`${GREEN}✨ Congratulations! Your codebase has 100% test coverage structure!${RESET}\n`);
  }
};
