import path from 'path';
import fs from 'fs';

export const ensureWorkspace = (): string => {
  const vibeforgeDir = path.join(process.cwd(), '.vibeforge');
  if (!fs.existsSync(vibeforgeDir)) {
    console.error('❌ Error: VibeForge workspace not initialized. Run "vibeforge init" first.');
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
