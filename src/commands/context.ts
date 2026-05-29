import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { estimateTokens } from '../utils/crypto';
import { updateContext } from '../services/context';

export const contextCommand = (options: any) => {
  const vibeforgeDir = ensureWorkspace();
  updateContext(vibeforgeDir);

  if (options.stats) {
    const contextPath = path.join(vibeforgeDir, 'context.md');
    const contextContent = fs.readFileSync(contextPath, 'utf-8');
    const tokens = estimateTokens(contextContent);

    console.log('\n📊 Context Stats');
    console.log(`Characters: ${contextContent.length}`);
    console.log(`Estimated Tokens: ~${tokens}`);
    console.log('');
  }
};
