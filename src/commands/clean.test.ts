import fs from 'fs';
import os from 'os';
import path from 'path';
import { cleanCommand } from './clean';

jest.mock('../utils/fs', () => ({
  ensureWorkspace: jest.fn(),
}));

jest.mock('../services/context', () => ({
  updateContext: jest.fn(),
}));

jest.mock('./lock', () => ({
  isWorkspaceLocked: jest.fn(() => false),
}));

import { ensureWorkspace } from '../utils/fs';

describe('cleanCommand', () => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    log.mockRestore();
  });

  it('clears typed memory when markdown memory is cleaned', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibeforge-clean-'));
    const vibeforgeDir = path.join(root, '.vibeforge');
    fs.mkdirSync(path.join(vibeforgeDir, 'memory'), { recursive: true });
    fs.writeFileSync(path.join(vibeforgeDir, 'memory', 'mem_001.md'), 'memory');
    fs.writeFileSync(path.join(vibeforgeDir, 'memory.json'), JSON.stringify([{ id: 'mem_001' }]));
    fs.writeFileSync(
      path.join(vibeforgeDir, 'links.json'),
      JSON.stringify([{ memoryId: 'mem_001' }])
    );
    jest.mocked(ensureWorkspace).mockReturnValue(vibeforgeDir);

    cleanCommand({ memory: true });

    expect(JSON.parse(fs.readFileSync(path.join(vibeforgeDir, 'memory.json'), 'utf-8'))).toEqual(
      []
    );
    expect(JSON.parse(fs.readFileSync(path.join(vibeforgeDir, 'links.json'), 'utf-8'))).toEqual([]);
    expect(fs.readdirSync(path.join(vibeforgeDir, 'memory'))).toEqual([]);

    fs.rmSync(root, { recursive: true, force: true });
  });
});
