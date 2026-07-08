import { ensureWorkspace } from '../utils/fs';
import { generateHandoff } from '../services/handoff';

export const handoffCommand = async () => {
  try {
    const vibeforgeDir = ensureWorkspace();
    const result = await generateHandoff(vibeforgeDir, { silent: true });

    console.log('\n Handoff generated\n');
    console.log(`  File: ${result.handoffPath}`);
    console.log(`  Branch: ${result.branchName}`);
    console.log(
      `  Coverage: ${result.plansCount} plan(s), ${result.memoriesCount} recent memory item(s)`
    );
    console.log(`  Suggested next step: ${result.recommendations[0]}`);
    console.log('');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(` Failed to generate handoff: ${message}`);
    process.exit(1);
  }
};
