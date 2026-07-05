import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { generateTimestamp } from '../utils/crypto';

interface DecisionOptions {
  reason?: string;
  impact?: string;
}

export const decisionCommand = (text: string, options: DecisionOptions) => {
  const vibeforgeDir = ensureWorkspace();
  const memDir = path.join(vibeforgeDir, 'memory');
  if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });

  const ts = generateTimestamp();
  const reason = options.reason || 'No reason provided';
  const impact = options.impact || 'Not specified';
  const safeTs = ts.replace(/[:.]/g, '-');
  const filename = `decision_${safeTs}.md`;

  const content = `# 🧩 Decision Record

**Timestamp:** ${ts}
**Decision:** ${text}

## Reasoning

${reason}

## Impact

${impact}

---

*Recorded by VibeForge Decision Log*
`;

  fs.writeFileSync(path.join(memDir, filename), content);

  console.log('\n🧩 Decision Recorded\n');
  console.log(`  📝 Decision: ${text}`);
  console.log(`  💡 Reason:   ${reason}`);
  console.log(`  📊 Impact:   ${impact}`);
  console.log(`  📂 Saved to: memory/${filename}`);
  console.log('');
};
