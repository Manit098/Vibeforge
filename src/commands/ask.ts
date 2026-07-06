import fs from 'fs';
import path from 'path';
import { buildProjectAwarePrompt, WorkspaceArtifact } from '../ai/prompt-builder';
import { requestAICompletion } from '../ai/provider';
import { updateContext } from '../services/context';
import { generateHandoff } from '../services/handoff';
import { ensureWorkspace } from '../utils/fs';

const readOptionalFile = (filePath: string): string => {
  if (!fs.existsSync(filePath)) {
    return '';
  }

  return fs.readFileSync(filePath, 'utf-8');
};

const byMostRecent = (dir: string, entries: fs.Dirent[]): fs.Dirent[] => {
  return entries.sort((left, right) => {
    const leftMtime = fs.statSync(path.join(dir, left.name)).mtimeMs;
    const rightMtime = fs.statSync(path.join(dir, right.name)).mtimeMs;
    return rightMtime - leftMtime;
  });
};

const readRecordArtifact = (recordsDir: string, entry: fs.Dirent): WorkspaceArtifact => {
  const fullPath = path.join(recordsDir, entry.name);

  if (entry.isDirectory()) {
    const summaryPath = path.join(fullPath, 'summary.md');
    const metaPath = path.join(fullPath, 'meta.json');
    const summary = readOptionalFile(summaryPath);
    const meta = readOptionalFile(metaPath);

    return {
      name: entry.name,
      content: [summary, meta].filter(Boolean).join('\n\n'),
    };
  }

  return {
    name: entry.name,
    content: readOptionalFile(fullPath),
  };
};

const readRecentArtifacts = (
  dir: string,
  limit: number,
  reader: (baseDir: string, entry: fs.Dirent) => WorkspaceArtifact = (baseDir, entry) => ({
    name: entry.name,
    content: readOptionalFile(path.join(baseDir, entry.name)),
  })
): WorkspaceArtifact[] => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = byMostRecent(
    dir,
    fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() || entry.isDirectory())
  );

  return entries
    .slice(0, limit)
    .map((entry) => reader(dir, entry))
    .filter((artifact) => artifact.content.trim().length > 0);
};

const ensureAskArtifacts = async (vibeforgeDir: string) => {
  const contextPath = path.join(vibeforgeDir, 'context.md');
  if (!fs.existsSync(contextPath) || fs.statSync(contextPath).size === 0) {
    updateContext(vibeforgeDir, { silent: true });
  }

  const handoffPath = path.join(vibeforgeDir, 'handoff.md');
  if (!fs.existsSync(handoffPath) || fs.statSync(handoffPath).size === 0) {
    await generateHandoff(vibeforgeDir, { silent: true });
  }
};

export const executeAsk = async (question?: string) => {
  const vibeforgeDir = ensureWorkspace();
  const normalizedQuestion = question?.trim() || 'What should I work on next in this project?';

  await ensureAskArtifacts(vibeforgeDir);

  const context = readOptionalFile(path.join(vibeforgeDir, 'context.md'));
  const handoff = readOptionalFile(path.join(vibeforgeDir, 'handoff.md'));
  const memories = readRecentArtifacts(path.join(vibeforgeDir, 'memory'), 6);
  const records = readRecentArtifacts(path.join(vibeforgeDir, 'records'), 6, readRecordArtifact);

  const prompt = buildProjectAwarePrompt({
    context,
    handoff,
    memories,
    records,
    question: normalizedQuestion,
  });

  const response = await requestAICompletion({ prompt }, process.cwd());
  console.log(`\n${response.text.trim()}\n`);
};

export const askCommand = async (question?: string) => {
  try {
    await executeAsk(question);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(` Failed to get AI response: ${message}`);
    process.exit(1);
  }
};

export const codexCommand = async (question?: string) => {
  await askCommand(question || 'What is this project?');
};
