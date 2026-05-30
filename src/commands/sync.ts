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
    const commitResult = await recordLatestCommit(vibeforgeDir, { silent: true });
    if (commitResult.status === 'recorded') {
      console.log(`  ✅ ${commitResult.message}`);
    } else {
      console.log(`  ℹ️  ${commitResult.message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  ⚠️  ${message}`);
  }

  // 2. Rebuild context
  console.log('  ⏳ Rebuilding context...');
  const contextResult = updateContext(vibeforgeDir, { silent: true });
  console.log(
    `  ✅ Context rebuilt (~${contextResult.stats.estimatedTokens} tokens from ${contextResult.stats.docs} docs, ${contextResult.stats.memory} memory entries, ${contextResult.stats.records} records)`
  );

  // 3. Generate handoff
  console.log('  ⏳ Generating handoff...');
  const handoffResult = await generateHandoff(vibeforgeDir, { silent: true });
  console.log(
    `  ✅ Handoff generated (branch: ${handoffResult.branchName}, plans: ${handoffResult.plansCount}, memory: ${handoffResult.memoriesCount})`
  );

  // 4. Update AGENT.md
  console.log('  ⏳ Updating AGENT.md...');
  generateAgentMd(vibeforgeDir);
  console.log('  ✅ AGENT.md updated');

  console.log('\n  Suggested next step: vibeforge ask "What should I build next?"');
  console.log('\n🎉 Full sync complete! Your project is up to date.\n');
};
