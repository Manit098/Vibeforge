import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { estimateTokens } from '../utils/crypto';
import { updateContext } from '../services/context';

export const contextCommand = (options: any) => {
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

  if (options.stats) {
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
