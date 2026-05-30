import path from 'path';
import fs from 'fs';
import { simpleGit } from 'simple-git';
import { generateTimestamp } from '../utils/crypto';
import { loadConfig } from '../utils/fs';

export interface HandoffBuildResult {
  handoffPath: string;
  content: string;
  branchName: string;
  plansCount: number;
  memoriesCount: number;
  recommendations: string[];
}

interface HandoffOptions {
  silent?: boolean;
}

const clipContent = (content: string, maxLength: number): string => {
  const trimmed = content.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}\n...[truncated]`;
};

const readRecentFiles = (
  dir: string,
  limit: number,
  maxLength: number
): { count: number; body: string } => {
  if (!fs.existsSync(dir)) {
    return { count: 0, body: '' };
  }

  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .sort(
      (left, right) =>
        fs.statSync(path.join(dir, right.name)).mtimeMs -
        fs.statSync(path.join(dir, left.name)).mtimeMs
    )
    .slice(0, limit);

  return {
    count: files.length,
    body: files
      .map((file) => {
        const filePath = path.join(dir, file.name);
        const content = clipContent(fs.readFileSync(filePath, 'utf-8'), maxLength);
        return `### ${file.name}\n${content}`;
      })
      .join('\n\n'),
  };
};

export const generateHandoff = async (
  vibeforgeDir: string,
  options: HandoffOptions = {}
): Promise<HandoffBuildResult> => {
  const config = loadConfig();
  const handoffPath = path.join(vibeforgeDir, 'handoff.md');
  const git = simpleGit();

  let gitInfo = 'Not a git repository or no git status available.';
  let branchName = 'Unknown';
  let recentCommits = 'None';

  const isRepo = await git.checkIsRepo();
  if (isRepo) {
    const status = await git.status();
    branchName = status.current || 'Unknown';
    const changedCount =
      status.modified.length +
      status.created.length +
      status.deleted.length +
      status.not_added.length;
    gitInfo = `- Active branch: ${branchName}
- Staged files: ${status.staged.length}
- Modified files: ${status.modified.length}
- New files: ${status.created.length + status.not_added.length}
- Deleted files: ${status.deleted.length}
- Working tree dirty: ${changedCount > 0 ? 'yes' : 'no'}`;

    const log = await git.log({ maxCount: 5 });
    if (log.all.length > 0) {
      recentCommits = log.all
        .map(
          (commit) => `- ${commit.hash.substring(0, 8)} ${commit.message} (${commit.author_name})`
        )
        .join('\n');
    }
  }

  const plansInfo = readRecentFiles(path.join(vibeforgeDir, 'plans'), 5, 1500);
  const memoriesInfo = readRecentFiles(path.join(vibeforgeDir, 'memory'), 5, 800);
  const docsDir = path.join(vibeforgeDir, 'docs');
  const recordsDir = path.join(vibeforgeDir, 'records');
  const contextPath = path.join(vibeforgeDir, 'context.md');
  const recommendations: string[] = [];

  if (!fs.existsSync(contextPath)) {
    recommendations.push('Run `vibeforge context` to regenerate project context.');
  }
  if (fs.existsSync(recordsDir) && fs.readdirSync(recordsDir).length === 0) {
    recommendations.push('Run `vibeforge record --update` to capture a fresh project record.');
  }
  if (plansInfo.count === 0) {
    recommendations.push(
      'Add a plan or checklist item so the next AI session has explicit priorities.'
    );
  }
  if (memoriesInfo.count === 0) {
    recommendations.push(
      'Record recent decisions with `vibeforge decision "<text>"` for stronger handoffs.'
    );
  }
  if (!fs.existsSync(docsDir) || fs.readdirSync(docsDir).length === 0) {
    recommendations.push(
      'Add project docs with `vibeforge add --docs <file>` to improve onboarding quality.'
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      'Ask `vibeforge ask "What should I build next?"` to continue from this handoff.'
    );
  }

  const timestamp = generateTimestamp();
  const handoffContent = `# VibeForge AI Agent Handoff State

**Handoff Timestamp:** ${timestamp}  
**Workspace:** \`${process.cwd()}\`
${config.projectName ? `**Project:** ${config.projectName}` : ''}
${config.description ? `**Description:** ${config.description}` : ''}

---

## 1. Repository Snapshot

${gitInfo}

### Recent Commits
${recentCommits}

---

## 2. Active Plans

${plansInfo.body || 'No active plans or checklists were found.'}

---

## 3. Recent Memory

${memoriesInfo.body || 'No recent project memory records were found.'}

---

## 4. Recommended Next Steps

${recommendations.map((item) => `- ${item}`).join('\n')}

---

## 5. Context Prime Command

To hand off this state to another AI developer, copy and paste this block into their initial system prompt:

\`\`\`text
Hello! You are taking over a coding session in this workspace.
Please read the following essential project documents to get up-to-speed instantly:
1. Read the PRD at: .vibeforge/docs/PRD.md
2. Read the Rules at: .vibeforge/docs/RULES.txt
3. Read the Tech Doc at: .vibeforge/docs/TECH_DOC.md
4. Read the Handoff State at: .vibeforge/handoff.md
5. Read the Compiled Project Context at: .vibeforge/context.md
${config.importantDocs && config.importantDocs.length > 0 ? `\n6. Read Important Docs: ${config.importantDocs.join(', ')}` : ''}

Once you have read these files, state your current understanding of the active task, recent commits, and list the very next logical implementation steps.
\`\`\`
`;

  fs.writeFileSync(handoffPath, handoffContent);

  if (!options.silent) {
    console.log(`✅ Handoff generated: ${handoffPath}`);
    console.log(
      `   Branch: ${branchName} | Plans: ${plansInfo.count} | Memory: ${memoriesInfo.count}`
    );
  }

  return {
    handoffPath,
    content: handoffContent,
    branchName,
    plansCount: plansInfo.count,
    memoriesCount: memoriesInfo.count,
    recommendations,
  };
};
