import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';

const searchInDir = (dir: string, query: string, results: { file: string; line: number; text: string }[]) => {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      searchInDir(fullPath, query, results);
    } else if (item.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        const lowerQuery = query.toLowerCase();
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(lowerQuery)) {
            results.push({
              file: fullPath,
              line: idx + 1,
              text: line.trim(),
            });
          }
        });
      } catch {
        // Skip binary files
      }
    }
  }
};

export const searchCommand = (query: string) => {
  const vibeforgeDir = ensureWorkspace();

  console.log(`\n🔍 Searching for "${query}" across workspace...\n`);

  const results: { file: string; line: number; text: string }[] = [];
  const searchDirs = ['docs', 'memory', 'records', 'plans'];

  searchDirs.forEach((sub) => {
    searchInDir(path.join(vibeforgeDir, sub), query, results);
  });

  // Also search context.md and handoff.md
  ['context.md', 'handoff.md', 'prompt.txt'].forEach((file) => {
    const filePath = path.join(vibeforgeDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const lowerQuery = query.toLowerCase();
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(lowerQuery)) {
          results.push({ file: filePath, line: idx + 1, text: line.trim() });
        }
      });
    }
  });

  if (results.length === 0) {
    console.log('  No matches found.\n');
    return;
  }

  // Group by file
  const grouped: { [key: string]: { line: number; text: string }[] } = {};
  results.forEach((r) => {
    const relPath = path.relative(vibeforgeDir, r.file);
    if (!grouped[relPath]) grouped[relPath] = [];
    grouped[relPath].push({ line: r.line, text: r.text });
  });

  Object.keys(grouped).forEach((file) => {
    console.log(`  📄 ${file}`);
    grouped[file].slice(0, 5).forEach((match) => {
      const truncated = match.text.length > 100 ? match.text.substring(0, 100) + '...' : match.text;
      console.log(`     L${match.line}: ${truncated}`);
    });
    if (grouped[file].length > 5) {
      console.log(`     ... and ${grouped[file].length - 5} more matches`);
    }
    console.log('');
  });

  console.log(`✅ Found ${results.length} match(es) in ${Object.keys(grouped).length} file(s).\n`);
};
