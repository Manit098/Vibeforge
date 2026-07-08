import {
  MemoryItem,
  retrieveRelevantMemories,
  renderMemoryMarkdown,
  scoreMemoryForFile,
} from './memory';

const makeMemory = (overrides: Partial<MemoryItem>): MemoryItem => ({
  id: 'mem_001',
  type: 'decision',
  content: 'Use refresh tokens for auth sessions.',
  tags: ['auth'],
  files: ['src/auth/session.ts'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('memory retrieval', () => {
  it('scores exact file matches higher than unrelated memories', () => {
    const exact = makeMemory({ id: 'mem_001', files: ['src/auth/session.ts'] });
    const unrelated = makeMemory({
      id: 'mem_002',
      content: 'Billing uses Stripe webhooks.',
      tags: ['billing'],
      files: ['src/billing/webhook.ts'],
    });

    const exactScore = scoreMemoryForFile(exact, 'src/auth/session.ts').score;
    const unrelatedScore = scoreMemoryForFile(unrelated, 'src/auth/session.ts').score;

    expect(exactScore).toBeGreaterThan(unrelatedScore);
  });

  it('returns relevant memories in score order', () => {
    const memories = [
      makeMemory({
        id: 'mem_002',
        content: 'Billing uses Stripe webhooks.',
        tags: ['billing'],
        files: ['src/billing/webhook.ts'],
      }),
      makeMemory({
        id: 'mem_001',
        content: 'Auth routes use refresh tokens.',
        tags: ['auth'],
        files: ['src/auth/session.ts'],
      }),
    ];

    const results = retrieveRelevantMemories(memories, 'src/auth/session.ts');

    expect(results[0].memory.id).toBe('mem_001');
  });

  it('renders typed memory as readable markdown', () => {
    const markdown = renderMemoryMarkdown(
      makeMemory({
        id: 'mem_010',
        type: 'rule',
        content: 'Validate input before service calls.',
        tags: ['api'],
        files: ['src/api/users.ts'],
      })
    );

    expect(markdown).toContain('# Rule Memory mem_010');
    expect(markdown).toContain('**Tags:** api');
    expect(markdown).toContain('**Files:** src/api/users.ts');
    expect(markdown).toContain('Validate input before service calls.');
  });
});
