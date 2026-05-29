import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { generateId, generateTimestamp } from '../utils/crypto';
import { updateContext } from '../services/context';

export const promptCommand = (text: string, options: any) => {
  const vibeforgeDir = ensureWorkspace();
  const recordsDir = path.join(vibeforgeDir, 'records');

  if (!fs.existsSync(recordsDir)) {
    fs.mkdirSync(recordsDir, { recursive: true });
  }

  const id = generateId();
  const timestamp = generateTimestamp();
  const promptFileName = `record_prompt_${id}_${timestamp.replace(/[:.]/g, '-')}.md`;
  const promptPath = path.join(recordsDir, promptFileName);

  const promptContent = `# AI Prompt Record

**ID:** ${id}
**Timestamp:** ${timestamp}
**Reasoning/Goal:** ${options.reason || 'Not specified'}

## Prompt Text

\`\`\`text
${text}
\`\`\`
`;

  fs.writeFileSync(promptPath, promptContent);
  console.log(`📝 Prompt saved: ${promptFileName}`);
  updateContext(vibeforgeDir);
};
