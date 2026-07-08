import { spawnSync } from 'child_process';
import {
  detectGitBranch,
  ensureMemoryWorkspace,
  normalizeFilePath,
  readMemories,
  retrieveRelevantMemories,
} from '../services/memory';

const copyToClipboard = (text: string): boolean => {
  if (process.platform === 'win32') {
    return spawnSync('clip', { input: text }).status === 0;
  }

  if (process.platform === 'darwin') {
    return spawnSync('pbcopy', { input: text }).status === 0;
  }

  return (
    spawnSync('wl-copy', { input: text }).status === 0 ||
    spawnSync('xclip', ['-selection', 'clipboard'], { input: text }).status === 0
  );
};

export const buildAiPrompt = (filePath: string): string => {
  const vibeforgeDir = ensureMemoryWorkspace();
  const memories = readMemories(vibeforgeDir);
  const results = retrieveRelevantMemories(memories, filePath, detectGitBranch(), 5).filter(
    (result) => result.score > 0
  );

  const memoryLines =
    results.length > 0
      ? results
          .map(
            (result) =>
              `- ${result.memory.type.charAt(0).toUpperCase() + result.memory.type.slice(1)}: ${
                result.memory.content
              }`
          )
          .join('\n')
      : '- No strong memory matches found yet.';

  return `You are working inside this codebase.

Current file:
${filePath}

Relevant project memory:
${memoryLines}

Instructions:
Use the above project memory while editing this file.
Do not break existing architecture decisions.
Follow project rules and constraints.
If you make changes, explain how they relate to the existing memory.
`;
};

interface PromptOptions {
  copy?: boolean;
}

export const promptCommand = (filePath: string, options: PromptOptions) => {
  const normalizedFilePath = normalizeFilePath(filePath);
  const prompt = buildAiPrompt(normalizedFilePath);

  console.log(prompt);

  if (options.copy) {
    if (copyToClipboard(prompt)) {
      console.log('Prompt copied to clipboard.');
    } else {
      console.log('Clipboard copy is not available on this system.');
    }
  }
};
