import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { scanCodebase } from '../services/codegraph';

const treeToString = (node: any, prefix: string = '', isLast: boolean = true, depth: number = 0): string => {
  if (depth > 4) return ''; // Limit depth
  let result = '';
  const connector = isLast ? '└── ' : '├── ';
  const extension = isLast ? '    ' : '│   ';

  if (depth > 0) {
    const sizeStr = node.type === 'file' && node.size ? ` (${(node.size / 1024).toFixed(1)}KB)` : '';
    result += `${prefix}${connector}${node.name}${node.type === 'directory' ? '/' : sizeStr}\n`;
  } else {
    result += `${node.name}/\n`;
  }

  if (node.children && node.type === 'directory') {
    const sorted = [...node.children].sort((a: any, b: any) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });
    sorted.forEach((child: any, i: number) => {
      result += treeToString(child, prefix + (depth > 0 ? extension : ''), i === sorted.length - 1, depth + 1);
    });
  }
  return result;
};

export const blueprintCommand = () => {
  const cwd = process.cwd();
  const vibeforgeDir = path.join(cwd, '.vibeforge');

  console.log('\n🧬 Generating Architecture Blueprint...\n');

  const tree = scanCodebase(cwd);

  // Collect stats
  const langMap: { [key: string]: number } = {};
  const moduleMap: { [key: string]: string[] } = {};

  const collect = (node: any, parentModule: string = '') => {
    if (node.type === 'file') {
      const ext = node.extension || '(none)';
      langMap[ext] = (langMap[ext] || 0) + 1;
    }
    if (node.type === 'directory' && node.children) {
      const modName = parentModule ? `${parentModule}/${node.name}` : node.name;
      const files = node.children.filter((c: any) => c.type === 'file').map((c: any) => c.name);
      if (files.length > 0) {
        moduleMap[modName] = files;
      }
      node.children.forEach((c: any) => collect(c, modName));
    }
  };
  if (tree.children) tree.children.forEach((c: any) => collect(c));

  // Build blueprint doc
  let blueprint = `# 🧬 Architecture Blueprint\n\n`;
  blueprint += `**Project:** ${path.basename(cwd)}\n`;
  blueprint += `**Generated:** ${new Date().toISOString()}\n\n---\n\n`;

  // File tree
  blueprint += `## 📂 Directory Structure\n\n\`\`\`\n${treeToString(tree)}\`\`\`\n\n---\n\n`;

  // Language breakdown
  blueprint += `## 🗂️ Language Summary\n\n`;
  blueprint += `| Extension | Count |\n|:---|:---|\n`;
  Object.keys(langMap).sort((a, b) => langMap[b] - langMap[a]).forEach((ext) => {
    blueprint += `| ${ext} | ${langMap[ext]} |\n`;
  });
  blueprint += `\n---\n\n`;

  // Module summary
  blueprint += `## 🧩 Module Summary\n\n`;
  Object.keys(moduleMap).forEach((mod) => {
    blueprint += `### ${mod}/\n`;
    moduleMap[mod].forEach((f) => { blueprint += `- ${f}\n`; });
    blueprint += '\n';
  });

  // Dependencies
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      blueprint += `---\n\n## 📦 Dependencies\n\n`;
      if (pkg.dependencies) {
        blueprint += `### Production\n`;
        Object.entries(pkg.dependencies).forEach(([name, ver]) => {
          blueprint += `- **${name}**: ${ver}\n`;
        });
        blueprint += '\n';
      }
      if (pkg.devDependencies) {
        blueprint += `### Development\n`;
        Object.entries(pkg.devDependencies).forEach(([name, ver]) => {
          blueprint += `- **${name}**: ${ver}\n`;
        });
      }
    } catch {}
  }

  // Save
  const outPath = fs.existsSync(vibeforgeDir)
    ? path.join(vibeforgeDir, 'blueprint.md')
    : path.join(cwd, 'blueprint.md');
  fs.writeFileSync(outPath, blueprint);

  console.log(`✅ Blueprint saved to: ${path.relative(cwd, outPath)}`);
  console.log(`📏 Size: ${(blueprint.length / 1024).toFixed(1)} KB\n`);
};
