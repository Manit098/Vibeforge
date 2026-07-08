import { buildProjectAwarePrompt } from './prompt-builder';

describe('buildProjectAwarePrompt', () => {
  it('builds the expected structured sections from workspace artifacts', () => {
    const prompt = buildProjectAwarePrompt({
      context: 'System uses JWT auth and a command-based CLI.',
      handoff: 'Recent changes include adding health and dashboard commands.',
      memories: [
        { name: 'decision_2026-05-29.md', content: 'Decision: keep records in markdown.' },
        { name: 'memory_2026-05-30.md', content: 'Added project stats tracking.' },
      ],
      records: [{ name: 'record_commit_abc.md', content: 'Commit added dashboard analytics.' }],
      question: 'Explain the auth architecture.',
    });

    expect(prompt).toContain('PROJECT CONTEXT');
    expect(prompt).toContain('Architecture');
    expect(prompt).toContain('Recent Changes');
    expect(prompt).toContain('Decisions');
    expect(prompt).toContain('Records');
    expect(prompt).toContain('User Question');
    expect(prompt).toContain('Explain the auth architecture.');
    expect(prompt).toContain('Decision: keep records in markdown.');
    expect(prompt).toContain('Added project stats tracking.');
  });

  it('falls back to empty-state text when no optional artifacts exist', () => {
    const prompt = buildProjectAwarePrompt({
      context: '',
      handoff: '',
      memories: [],
      records: [],
      question: 'What is this project?',
    });

    expect(prompt).toContain('Not available.');
    expect(prompt).toContain('No recent memory summaries were found.');
    expect(prompt).toContain('No explicit decision records were found in recent memory.');
    expect(prompt).toContain('No recent records were found.');
  });
});
