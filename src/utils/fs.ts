import path from 'path';
import fs from 'fs';

export interface VibeForgeConfig {
  projectName?: string;
  description?: string;
  importantDocs?: string[];
  ignore?: string[];
}

const DEFAULT_IGNORE = [
  'node_modules',
  '.git',
  '.vibeforge',
  'dist',
  'build',
  'coverage',
  '.DS_Store',
  '*.log',
];

export const loadConfig = (cwd: string = process.cwd()): VibeForgeConfig => {
  const configPath = path.join(cwd, 'vibeforge.json');
  if (!fs.existsSync(configPath)) {
    return { ignore: DEFAULT_IGNORE };
  }
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content) as VibeForgeConfig;
    return {
      ...parsed,
      ignore: [...(parsed.ignore || []), ...DEFAULT_IGNORE],
    };
  } catch {
    return { ignore: DEFAULT_IGNORE };
  }
};

export const ensureWorkspace = (): string => {
  const vibeforgeDir = path.join(process.cwd(), '.vibeforge');
  if (!fs.existsSync(vibeforgeDir)) {
    console.error(' Error: VibeForge workspace not initialized. Run "vibeforge init" first.');
    process.exit(1);
  }
  return vibeforgeDir;
};

export const countFilesInDir = (dir: string): number => {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true }).filter((item) => item.isFile()).length;
};

export const countDirsInDir = (dir: string): number => {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true }).filter((item) => item.isDirectory()).length;
};
