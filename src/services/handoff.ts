import path from 'path';
import fs from 'fs';
import { simpleGit } from 'simple-git';
import { generateTimestamp } from '../utils/crypto';

export const generateHandoff = async (vibeforgeDir: string) => {
  try {
    const handoffPath = path.join(vibeforgeDir, 'handoff.md');
    const git = simpleGit();

    let gitInfo = 'Not a git repository or no git status available.';
    let branchName = 'Unknown';
    let recentCommits = 'None';

    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      const status = await git.status();
      branchName = status.current || 'Unknown';
      gitInfo = `**Active Branch:** ${branchName}\n`;
      if (status.modified.length > 0) {
        gitInfo += `**Modified Files:**\n${status.modified.map((f) => `- ${f}`).join('\n')}\n`;
      }
      if (status.created.length > 0) {
        gitInfo += `**New Files:**\n${status.created.map((f) => `- ${f}`).join('\n')}\n`;
      }
      if (status.staged.length > 0) {
        gitInfo += `**Staged Files:**\n${status.staged.map((f) => `- ${f}`).join('\n')}\n`;
      }

      const log = await git.log({ maxCount: 5 });
      if (log && log.all.length > 0) {
        recentCommits = log.all
          .map((c) => `- **${c.hash.substring(0, 8)}**: ${c.message} (${c.author_name})`)
          .join('\n');
      }
    }

    // Read plans
    const plansDir = path.join(vibeforgeDir, 'plans');
    let plansInfo = 'No active plan checklists found.';
    if (fs.existsSync(plansDir)) {
      const files = fs.readdirSync(plansDir);
      if (files.length > 0) {
        plansInfo = '';
        files.forEach((file) => {
          const content = fs.readFileSync(path.join(plansDir, file), 'utf-8');
          plansInfo += `### Plan: ${file}\n\n${content}\n\n`;
        });
      }
    }

    // Read recent memories
    const memoryDir = path.join(vibeforgeDir, 'memory');
    let memoriesInfo = 'No recent project memory records found.';
    if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir).sort().reverse().slice(0, 5);
      if (files.length > 0) {
        memoriesInfo = '';
        files.forEach((file) => {
          const content = fs.readFileSync(path.join(memoryDir, file), 'utf-8');
          memoriesInfo += `### ${file}\n${content.substring(0, 300)}${content.length > 300 ? '...' : ''}\n\n`;
        });
      }
    }

    const timestamp = generateTimestamp();
    const handoffContent = `# VibeForge AI Agent Handoff State

**Handoff Timestamp:** ${timestamp}  
**Workspace:** \`${process.cwd()}\`

---

## 1. Current Repository Status

${gitInfo}

### Recent Commit History
${recentCommits}

---

## 2. Active Plans & Todo Status

${plansInfo}

---

## 3. High-Priority Project Memory

${memoriesInfo}

---

## 4. Context Prime Command

To hand off this state to another AI developer, copy and paste this block into their initial system prompt:

\`\`\`text
Hello! You are taking over a coding session in this workspace. 
Please read the following essential project documents to get up-to-speed instantly:
1. Read the PRD at: .vibeforge/docs/PRD.md
2. Read the Rules at: .vibeforge/docs/RULES.txt
3. Read the Tech Doc at: .vibeforge/docs/TECH_DOC.md
4. Read the Handoff State at: .vibeforge/handoff.md
5. Read the Compiled Project Context at: .vibeforge/context.md

Once you have read these files, state your current understanding of the active task, recent commits, and list the very next logical implementation steps.
\`\`\`
`;

    fs.writeFileSync(handoffPath, handoffContent);
    console.log(`\n🎯 Handoff state compiled successfully -> ${handoffPath}`);
    console.log('\n--- Handoff Preview ---');
    console.log(handoffContent.substring(0, 1000) + '...\n------------------------\n');
  } catch (error: any) {
    console.error('❌ Failed to generate handoff:', error.message);
  }
};
