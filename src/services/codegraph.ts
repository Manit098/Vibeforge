import path from 'path';
import fs from 'fs';
import { CodegraphNode } from '../types';

export const scanCodebase = (dirPath: string): CodegraphNode => {
  const result: CodegraphNode = {
    path: dirPath,
    name: path.basename(dirPath),
    type: 'directory',
    children: [],
  };

  if (!fs.existsSync(dirPath)) return result;

  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    if (item.name === 'node_modules' || item.name === '.git' || item.name === '.vibeforge') {
      continue;
    }

    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      result.children?.push(scanCodebase(fullPath));
    } else {
      const stats = fs.statSync(fullPath);
      result.children?.push({
        path: fullPath,
        name: item.name,
        type: 'file',
        size: stats.size,
        extension: path.extname(item.name),
      });
    }
  }

  return result;
};
