import path from 'path';
import chokidar from 'chokidar';
import { ensureWorkspace } from '../utils/fs';
import { generateRecord, recordLatestCommit } from '../services/records';

export const recordCommand = async (options: any) => {
  const vibeforgeDir = ensureWorkspace();

  if (options.commit) {
    try {
      const result = await recordLatestCommit(vibeforgeDir);
      if (result.status === 'recorded') {
        console.log(`✅ ${result.message}`);
      } else {
        console.log(`ℹ️ ${result.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${message}`);
      process.exit(1);
    }
    return;
  }

  if (options.generate) {
    const targetPath = options.generate === '.' ? process.cwd() : path.resolve(options.generate);
    generateRecord(targetPath, vibeforgeDir);
    return;
  }

  if (options.update) {
    generateRecord(process.cwd(), vibeforgeDir);
    return;
  }

  if (options.watch) {
    const targetPath = options.watch === '.' ? process.cwd() : path.resolve(options.watch);
    console.log(`👀 Watching for changes in: ${targetPath}`);

    const watcher = chokidar.watch(targetPath, {
      ignored: /(node_modules|\.git|\.vibeforge)/,
      persistent: true,
    });

    let debounceTimer: NodeJS.Timeout;

    const handleChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('\n🔄 Change detected! Generating new record...');
        generateRecord(targetPath, vibeforgeDir);
      }, 1000);
    };

    watcher
      .on('add', handleChange)
      .on('change', handleChange)
      .on('unlink', handleChange)
      .on('addDir', handleChange)
      .on('unlinkDir', handleChange);

    process.on('SIGINT', () => {
      console.log('\n👋 Stopping watcher...');
      watcher.close();
      process.exit(0);
    });
  } else {
    console.error('❌ Error: Use either --commit, --generate, --update, or --watch option');
    process.exit(1);
  }
};
