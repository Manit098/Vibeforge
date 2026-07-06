import { buildAiPrompt } from './prompt';
import * as memory from '../services/memory';

jest.mock('../services/memory', () => {
  const actual = jest.requireActual('../services/memory');
  return {
    ...actual,
    ensureMemoryWorkspace: jest.fn(),
    readMemories: jest.fn(),
    detectGitBranch: jest.fn(),
  };
});

describe('buildAiPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(memory.ensureMemoryWorkspace).mockReturnValue('.vibeforge');
    jest.mocked(memory.detectGitBranch).mockReturnValue('main');
  });

  it('includes relevant typed memory for the requested file', () => {
    jest.mocked(memory.readMemories).mockReturnValue([
      {
        id: 'mem_001',
        type: 'decision',
        content: 'Auth sessions use refresh tokens.',
        tags: ['auth'],
        files: ['src/auth/session.ts'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const prompt = buildAiPrompt('src/auth/session.ts');

    expect(prompt).toContain('Current file:');
    expect(prompt).toContain('src/auth/session.ts');
    expect(prompt).toContain('Decision: Auth sessions use refresh tokens.');
  });
});
