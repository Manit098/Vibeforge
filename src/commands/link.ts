import {
  ensureMemoryWorkspace,
  normalizeFilePath,
  readLinks,
  readMemories,
  writeLinks,
  writeMemories,
  LinkRecord,
} from '../services/memory';

export const linkCommand = (memoryId: string, filePath: string) => {
  const vibeforgeDir = ensureMemoryWorkspace();
  const memories = readMemories(vibeforgeDir);
  const memory = memories.find((item) => item.id === memoryId);

  if (!memory) {
    console.error(`Error: memory not found: ${memoryId}`);
    process.exit(1);
  }

  const normalizedFilePath = normalizeFilePath(filePath);
  if (!memory.files.includes(normalizedFilePath)) {
    memory.files.push(normalizedFilePath);
    memory.updatedAt = new Date().toISOString();
    writeMemories(vibeforgeDir, memories);
  }

  const links = readLinks(vibeforgeDir);
  const exists = links.some(
    (link) => link.memoryId === memoryId && normalizeFilePath(link.filePath) === normalizedFilePath
  );

  if (!exists) {
    const link: LinkRecord = {
      memoryId,
      filePath: normalizedFilePath,
      createdAt: new Date().toISOString(),
    };
    writeLinks(vibeforgeDir, [...links, link]);
  }

  console.log(`Linked ${memoryId} to ${normalizedFilePath}`);
};
