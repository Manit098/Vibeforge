import fs from 'fs';
import os from 'os';
import path from 'path';
import { readDirRecursive } from './export';

describe('readDirRecursive', () => {
  it('keeps relative paths for nested files with duplicate names', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibeforge-export-'));
    fs.mkdirSync(path.join(dir, 'a'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'b'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'a', 'note.md'), 'from a');
    fs.writeFileSync(path.join(dir, 'b', 'note.md'), 'from b');

    expect(readDirRecursive(dir)).toEqual({
      [path.join('a', 'note.md')]: 'from a',
      [path.join('b', 'note.md')]: 'from b',
    });

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
