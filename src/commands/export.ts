import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { generateTimestamp } from '../utils/crypto';

const readDirRecursive = (dir: string): { [key: string]: string } => {
  const result: { [key: string]: string } = {};
  if (!fs.existsSync(dir)) return result;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      const sub = readDirRecursive(fullPath);
      Object.keys(sub).forEach((k) => {
        result[path.join(item.name, k)] = sub[k];
      });
    } else if (item.isFile()) {
      try {
        result[item.name] = fs.readFileSync(fullPath, 'utf-8');
      } catch {
        result[item.name] = '[Binary file  skipped]';
      }
    }
  }
  return result;
};

interface ExportOptions {
  format?: string;
  output?: string;
}

export const exportCommand = (options: ExportOptions) => {
  const vibeforgeDir = ensureWorkspace();
  const format = options.format || 'json';
  const timestamp = generateTimestamp().replace(/[:.]/g, '-');

  const defaultFilename =
    format === 'json' ? `vibeforge-export-${timestamp}.json` : `vibeforge-export-${timestamp}.md`;
  const outputPath = path.resolve(options.output || defaultFilename);

  console.log(`\n Exporting workspace as ${format.toUpperCase()}...\n`);

  const docs = readDirRecursive(path.join(vibeforgeDir, 'docs'));
  const memory = readDirRecursive(path.join(vibeforgeDir, 'memory'));
  const records = readDirRecursive(path.join(vibeforgeDir, 'records'));
  const plans = readDirRecursive(path.join(vibeforgeDir, 'plans'));

  let contextContent = '';
  const contextPath = path.join(vibeforgeDir, 'context.md');
  if (fs.existsSync(contextPath)) {
    contextContent = fs.readFileSync(contextPath, 'utf-8');
  }

  let handoffContent = '';
  const handoffPath = path.join(vibeforgeDir, 'handoff.md');
  if (fs.existsSync(handoffPath)) {
    handoffContent = fs.readFileSync(handoffPath, 'utf-8');
  }

  if (format === 'json') {
    const exportData = {
      exportedAt: new Date().toISOString(),
      workspace: process.cwd(),
      docs,
      memory,
      records,
      plans,
      context: contextContent,
      handoff: handoffContent,
    };
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  } else {
    let md = `# VibeForge Workspace Export\n\n`;
    md += `**Exported:** ${new Date().toISOString()}\n`;
    md += `**Workspace:** \`${process.cwd()}\`\n\n---\n\n`;

    const appendSection = (title: string, files: { [k: string]: string }) => {
      const keys = Object.keys(files);
      if (keys.length === 0) return;
      md += `## ${title}\n\n`;
      keys.forEach((k) => {
        md += `### ${k}\n\n${files[k]}\n\n---\n\n`;
      });
    };

    appendSection('Documentation', docs);
    appendSection('Memory', memory);
    appendSection('Records', records);
    appendSection('Plans', plans);

    if (contextContent) {
      md += `## Context\n\n${contextContent}\n\n---\n\n`;
    }
    if (handoffContent) {
      md += `## Handoff\n\n${handoffContent}\n\n---\n\n`;
    }

    fs.writeFileSync(outputPath, md);
  }

  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(` Exported to: ${outputPath}`);
  console.log(` File size: ${sizeKB} KB\n`);
};
