import path from 'path';
import fs from 'fs';

export const generateAgentMd = (vibeforgeDir: string) => {
  const docsDir = path.join(vibeforgeDir, 'docs');
  const agentPath = path.join(docsDir, 'AGENT.md');

  let agentContent = `# VibeForge AI Agent

ROLE

Principal Engineer

Mission:

Preserve project memory.
Do not generate blind code.

---

WORKFLOW

Read Context



Read Docs



Read Plans



Inspect Memory



Plan



Implement



Update Records



Update Context



Commit

---

PRIORITY

context

architecture

consistency

code

---

REQUIRED INPUT

PRD
RULES
TECH DOC
memory
records

---

REQUIRED OUTPUT

implementation
changes
impact
memory update
handoff update

---

AFTER EVERY FEATURE

update memory
update records
update context
update docs

---

NEVER

rewrite architecture
ignore docs
skip reasoning
duplicate systems

---

SUCCESS

Another AI should continue work instantly.
`;

  fs.writeFileSync(agentPath, agentContent);
  console.log(' AGENT.md generated!');
};
