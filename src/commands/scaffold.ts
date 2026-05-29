import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';

const TEMPLATES: { [key: string]: { filename: string; content: string } } = {
  decision: {
    filename: 'decision_template.md',
    content: `# 🧩 Decision Record

**Date:** [YYYY-MM-DD]
**Author:** [Your Name]
**Status:** [Proposed / Accepted / Deprecated]

## Decision

[What was decided]

## Context

[Background and constraints that led to this decision]

## Reasoning

[Why this option was chosen over alternatives]

## Alternatives Considered

1. [Alternative A] — [Why rejected]
2. [Alternative B] — [Why rejected]

## Impact

[Expected consequences and follow-up actions]

## Related

- [Links to related decisions, PRDs, or tickets]
`,
  },
  plan: {
    filename: 'plan_template.md',
    content: `# 📋 Project Plan

**Created:** [YYYY-MM-DD]
**Owner:** [Your Name]
**Status:** 🟨 In Progress

## Goal

[What this plan aims to achieve]

## Milestones

- [ ] Milestone 1: [Description]
- [ ] Milestone 2: [Description]
- [ ] Milestone 3: [Description]

## Tasks

### Phase 1
- [ ] Task 1.1
- [ ] Task 1.2

### Phase 2
- [ ] Task 2.1
- [ ] Task 2.2

## Success Criteria

- [How we know this plan succeeded]

## Risks

- [Risk 1] — Mitigation: [approach]
`,
  },
  memory: {
    filename: 'memory_template.md',
    content: `# 🧠 Memory Entry

**Timestamp:** [YYYY-MM-DD HH:MM]
**Category:** [observation / decision / learning / bug / insight]

## Context

[What were you working on when this came up?]

## Entry

[The knowledge, observation, or decision to record]

## Why It Matters

[Why is this worth remembering?]
`,
  },
  docs: {
    filename: 'doc_template.md',
    content: `# 📄 [Document Title]

**Version:** 1.0
**Last Updated:** [YYYY-MM-DD]
**Author:** [Your Name]

## Overview

[Brief summary of what this document covers]

## Details

[Main content of the document]

## References

- [Related documents or links]
`,
  },
  retrospective: {
    filename: 'retro_template.md',
    content: `# 🔄 Sprint Retrospective

**Sprint:** [Sprint Name/Number]
**Date:** [YYYY-MM-DD]
**Participants:** [Team Members]

## What Went Well 🟢

- [Item 1]
- [Item 2]

## What Could Improve 🟡

- [Item 1]
- [Item 2]

## Action Items 🔴

- [ ] [Action 1] — Owner: [Name]
- [ ] [Action 2] — Owner: [Name]

## Key Metrics

- Commits: [X]
- Records Created: [X]
- Decisions Logged: [X]
`,
  },
};

export const scaffoldCommand = (type: string) => {
  const vibeforgeDir = ensureWorkspace();
  const template = TEMPLATES[type];

  if (!template) {
    console.log('\n🏗️  Available scaffold templates:\n');
    Object.keys(TEMPLATES).forEach((k) => {
      console.log(`  vibeforge scaffold ${k.padEnd(16)} → ${TEMPLATES[k].filename}`);
    });
    console.log('');
    return;
  }

  const targetDir = type === 'decision' || type === 'memory' || type === 'retrospective'
    ? path.join(vibeforgeDir, 'memory')
    : type === 'plan'
    ? path.join(vibeforgeDir, 'plans')
    : path.join(vibeforgeDir, 'docs');

  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const outPath = path.join(targetDir, template.filename);
  if (fs.existsSync(outPath)) {
    console.log(`\n⚠️  Template already exists: ${path.relative(process.cwd(), outPath)}`);
    console.log('   Delete it first or edit the existing file.\n');
    return;
  }

  fs.writeFileSync(outPath, template.content);
  console.log(`\n🏗️  Scaffold created: ${path.relative(process.cwd(), outPath)}`);
  console.log(`   Edit the template and fill in your project details.\n`);
};
