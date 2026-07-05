import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { estimateTokens } from '../utils/crypto';
import { updateContext } from '../services/context';
import {
  detectGitBranch,
  ensureMemoryWorkspace,
  normalizeFilePath,
  readMemories,
  retrieveRelevantMemories,
} from '../services/memory';

interface ContextOptions {
  stats?: boolean;
}

export const contextCommand = (
  filePathOrOptions?: string | ContextOptions,
  options?: ContextOptions
) => {
  if (typeof filePathOrOptions === 'string') {
    const filePath = normalizeFilePath(filePathOrOptions);
    const vibeforgeDir = ensureMemoryWorkspace();
    const memories = readMemories(vibeforgeDir);

    if (memories.length === 0) {
      console.log(`No project memory found yet.`);
      console.log(`Run: vibeforge record decision "Important project decision" --file ${filePath}`);
      return;
    }

    const branch = detectGitBranch();
    const results = retrieveRelevantMemories(memories, filePath, branch, 5);
    const strongResults = results.filter((result) => result.score > 0);
    const displayResults = strongResults.length > 0 ? strongResults : results;

    console.log(`\nRelevant project memory for ${filePath}\n`);
    if (strongResults.length === 0) {
      console.log('No strong matches found. Showing closest memories.\n');
    }

    displayResults.forEach((result, index) => {
      console.log(
        `${index + 1}. [${result.memory.type}] ${result.memory.id} - score: ${result.score}`
      );
      console.log(`   ${result.memory.content}`);
      console.log(`   Reason: ${result.reasons.join(', ')}`);
      if (result.memory.tags.length > 0) {
        console.log(`   Tags: ${result.memory.tags.join(', ')}`);
      }
      if (result.memory.files.length > 0) {
        console.log(`   Files: ${result.memory.files.join(', ')}`);
      }
      console.log('');
    });
    return;
  }

  const commandOptions = options || filePathOrOptions || {};
  const vibeforgeDir = ensureWorkspace();
  const result = updateContext(vibeforgeDir, { silent: true });

  console.log('\n📚 Context rebuilt\n');
  console.log(`  File: ${result.contextPath}`);
  console.log(
    `  Sources: ${result.stats.docs} docs | ${result.stats.memory} memory | ${result.stats.records} records | ${result.stats.plans} plans`
  );
  console.log(
    `  Size: ${result.stats.characters} characters | ~${result.stats.estimatedTokens} tokens`
  );

  if (commandOptions.stats) {
    const contextPath = path.join(vibeforgeDir, 'context.md');
    const contextContent = fs.readFileSync(contextPath, 'utf-8');
    const tokens = estimateTokens(contextContent);

    console.log('\n📊 Context Stats');
    console.log(`Characters: ${contextContent.length}`);
    console.log(`Estimated Tokens: ~${tokens}`);
    console.log(`Path: ${contextPath}`);
  }

  console.log('');
};
