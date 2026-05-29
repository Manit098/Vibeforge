import { ensureWorkspace } from '../utils/fs';
import { updateContext } from '../services/context';
import { generateHandoff } from '../services/handoff';
import { generateAgentMd } from '../services/agent';
import { recordLatestCommit } from '../services/records';

export const syncCommand = async () => {
  const vibeforgeDir = ensureWorkspace();

  console.log('\n🔄 VibeForge Full Sync\n');

  // 1. Record latest commit
  console.log('  ⏳ Recording latest commit...');
  try {
    await recordLatestCommit(vibeforgeDir);
    console.log('  ✅ Latest commit recorded');
  } catch {
    console.log('  ⚠️  No new commits to record');
  }

  // 2. Rebuild context
  console.log('  ⏳ Rebuilding context...');
  updateContext(vibeforgeDir);
  console.log('  ✅ Context rebuilt');

  // 3. Generate handoff
  console.log('  ⏳ Generating handoff...');
  await generateHandoff(vibeforgeDir);
  console.log('  ✅ Handoff generated');

  // 4. Update AGENT.md
  console.log('  ⏳ Updating AGENT.md...');
  generateAgentMd(vibeforgeDir);
  console.log('  ✅ AGENT.md updated');

  console.log('\n🎉 Full sync complete! Your project is up to date.\n');
};
