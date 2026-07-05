import path from 'path';
import chokidar from 'chokidar';
import { ensureWorkspace } from '../utils/fs';
import { generateRecord, recordLatestCommit } from '../services/records';
import {
  ensureMemoryWorkspace,
  generateMemoryId,
  isMemoryType,
  normalizeFilePath,
  readMemories,
  writeMemories,
  MemoryItem,
} from '../services/memory';

interface LegacyRecordOptions {
  commit?: boolean;
  generate?: string;
  watch?: string;
  update?: boolean;
}

interface MemoryRecordOptions extends LegacyRecordOptions {
  tag?: string[];
  file?: string[];
}

export const recordCommand = async (
  typeOrOptions: string | LegacyRecordOptions,
  content?: string,
  options?: MemoryRecordOptions
) => {
  const isNewMemoryCommand = typeof typeOrOptions === 'string';
  const commandOptions: MemoryRecordOptions = isNewMemoryCommand
    ? options || {}
    : typeOrOptions || {};
  const vibeforgeDir = isNewMemoryCommand ? ensureMemoryWorkspace() : ensureWorkspace();

  if (isNewMemoryCommand) {
    const type = typeOrOptions;
    if (!isMemoryType(type)) {
      console.error(
        'Error: unsupported memory type. Use one of: decision, rule, feature, doc, prompt, note, challenge'
      );
      process.exit(1);
    }

    if (!content || !content.trim()) {
      console.error(`Error: missing memory content. Example: vibeforge record ${type} "Your note"`);
      process.exit(1);
    }

    const memories = readMemories(vibeforgeDir);
    const now = new Date().toISOString();
    const memory: MemoryItem = {
      id: generateMemoryId(memories),
      type,
      content: content.trim(),
      tags: (commandOptions.tag || []).map((tag) => tag.trim()).filter(Boolean),
      files: (commandOptions.file || [])
        .map((file) => normalizeFilePath(file.trim()))
        .filter(Boolean),
      createdAt: now,
      updatedAt: now,
    };

    writeMemories(vibeforgeDir, [...memories, memory]);
    console.log(`Recorded ${memory.type} memory ${memory.id}`);
    if (memory.tags.length > 0) {
      console.log(`Tags: ${memory.tags.join(', ')}`);
    }
    if (memory.files.length > 0) {
      console.log(`Files: ${memory.files.join(', ')}`);
    }
    return;
  }

  if (commandOptions.commit) {
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

  if (commandOptions.generate) {
    const targetPath =
      commandOptions.generate === '.' ? process.cwd() : path.resolve(commandOptions.generate);
    generateRecord(targetPath, vibeforgeDir);
    return;
  }

  if (commandOptions.update) {
    generateRecord(process.cwd(), vibeforgeDir);
    return;
  }

  if (commandOptions.watch) {
    const targetPath =
      commandOptions.watch === '.' ? process.cwd() : path.resolve(commandOptions.watch);
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
