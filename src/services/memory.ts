import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export type MemoryType = 'decision' | 'rule' | 'feature' | 'doc' | 'prompt' | 'note' | 'challenge';

export interface MemoryItem {
  id: string;
  type: MemoryType;
  content: string;
  tags: string[];
  files: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LinkRecord {
  memoryId: string;
  filePath: string;
  createdAt: string;
}

export interface MemoryConfig {
  projectName: string;
  rootPath: string;
  createdAt: string;
  git: {
    detected: boolean;
    branch?: string;
  };
}

export interface ScoredMemory {
  memory: MemoryItem;
  score: number;
  reasons: string[];
}

export interface GraphData {
  nodes: Array<{ id: string; type: string; label: string; path?: string }>;
  edges: Array<{ from: string; to: string; type: string }>;
}

const MEMORY_TYPES: MemoryType[] = [
  'decision',
  'rule',
  'feature',
  'doc',
  'prompt',
  'note',
  'challenge',
];

const USELESS_TOKENS = new Set([
  'src',
  'app',
  'lib',
  'utils',
  'util',
  'components',
  'component',
  'index',
  'test',
  'spec',
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'md',
]);

export const isMemoryType = (value: string): value is MemoryType =>
  MEMORY_TYPES.includes(value as MemoryType);

export const getVibeForgeDir = (cwd: string = process.cwd()): string =>
  path.join(cwd, '.vibeforge');

export const getMemoryPath = (vibeforgeDir: string): string =>
  path.join(vibeforgeDir, 'memory.json');

export const getLinksPath = (vibeforgeDir: string): string => path.join(vibeforgeDir, 'links.json');

export const getConfigPath = (vibeforgeDir: string): string =>
  path.join(vibeforgeDir, 'config.json');

export const getGraphPath = (vibeforgeDir: string): string => path.join(vibeforgeDir, 'graph.json');

export const normalizeFilePath = (filePath: string): string =>
  filePath.replace(/\\/g, '/').replace(/^\.\//, '');

export const readJsonSafe = <T>(filePath: string, fallback: T): T => {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
};

export const writeJsonSafe = (filePath: string, data: unknown): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
};

export const ensureMemoryWorkspace = (cwd: string = process.cwd()): string => {
  const vibeforgeDir = getVibeForgeDir(cwd);
  fs.mkdirSync(vibeforgeDir, { recursive: true });

  const configPath = getConfigPath(vibeforgeDir);
  if (!fs.existsSync(configPath)) {
    writeJsonSafe(configPath, createMemoryConfig(cwd));
  }

  const memoryPath = getMemoryPath(vibeforgeDir);
  if (!fs.existsSync(memoryPath)) {
    writeJsonSafe(memoryPath, []);
  }

  const linksPath = getLinksPath(vibeforgeDir);
  if (!fs.existsSync(linksPath)) {
    writeJsonSafe(linksPath, []);
  }

  const graphPath = getGraphPath(vibeforgeDir);
  if (!fs.existsSync(graphPath)) {
    writeJsonSafe(graphPath, { nodes: [], edges: [] });
  }

  return vibeforgeDir;
};

export const createMemoryConfig = (cwd: string = process.cwd()): MemoryConfig => {
  const gitDetected = detectGitRepo(cwd);
  const branch = gitDetected ? detectGitBranch(cwd) : undefined;

  return {
    projectName: path.basename(cwd),
    rootPath: cwd,
    createdAt: new Date().toISOString(),
    git: {
      detected: gitDetected,
      ...(branch ? { branch } : {}),
    },
  };
};

export const detectGitRepo = (cwd: string = process.cwd()): boolean => {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

export const detectGitBranch = (cwd: string = process.cwd()): string | undefined => {
  try {
    return execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim() || undefined;
  } catch {
    return undefined;
  }
};

export const readMemories = (vibeforgeDir: string): MemoryItem[] =>
  readJsonSafe<MemoryItem[]>(getMemoryPath(vibeforgeDir), []);

export const writeMemories = (vibeforgeDir: string, memories: MemoryItem[]): void => {
  writeJsonSafe(getMemoryPath(vibeforgeDir), memories);
};

export const readLinks = (vibeforgeDir: string): LinkRecord[] =>
  readJsonSafe<LinkRecord[]>(getLinksPath(vibeforgeDir), []);

export const writeLinks = (vibeforgeDir: string, links: LinkRecord[]): void => {
  writeJsonSafe(getLinksPath(vibeforgeDir), links);
};

export const generateMemoryId = (memories: MemoryItem[]): string => {
  const maxId = memories.reduce((max, memory) => {
    const match = /^mem_(\d+)$/.exec(memory.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `mem_${String(maxId + 1).padStart(3, '0')}`;
};

export const extractFileTokens = (filePath: string): string[] => {
  const normalized = normalizeFilePath(filePath).toLowerCase();
  const tokens = normalized
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !USELESS_TOKENS.has(token));

  return Array.from(new Set(tokens));
};

const sameFolder = (targetFile: string, linkedFile: string): boolean => {
  const targetFolder = path.posix.dirname(normalizeFilePath(targetFile));
  const linkedFolder = path.posix.dirname(normalizeFilePath(linkedFile));
  return targetFolder !== '.' && targetFolder === linkedFolder;
};

const recentlyUpdated = (memory: MemoryItem): boolean => {
  const updated = new Date(memory.updatedAt || memory.createdAt).getTime();
  if (Number.isNaN(updated)) {
    return false;
  }

  const thirtyDays = 1000 * 60 * 60 * 24 * 30;
  return Date.now() - updated <= thirtyDays;
};

export const scoreMemoryForFile = (
  memory: MemoryItem,
  filePath: string,
  branch?: string
): ScoredMemory => {
  let score = 0;
  const reasons: string[] = [];
  const target = normalizeFilePath(filePath);
  const linkedFiles = memory.files.map(normalizeFilePath);

  if (linkedFiles.includes(target)) {
    score += 50;
    reasons.push('exact file match');
  } else if (linkedFiles.some((linkedFile) => sameFolder(target, linkedFile))) {
    score += 25;
    reasons.push('same folder match');
  }

  const tokens = extractFileTokens(target);
  const haystack = [memory.content, ...memory.tags, ...linkedFiles].join(' ').toLowerCase();
  const matchedTokens = tokens.filter((token) => haystack.includes(token));
  if (matchedTokens.length > 0) {
    score += matchedTokens.length * 10;
    reasons.push(`keyword match: ${matchedTokens.join(', ')}`);
  }

  if (memory.type === 'decision') {
    score += 15;
    reasons.push('decision priority');
  } else if (memory.type === 'rule') {
    score += 15;
    reasons.push('rule priority');
  } else if (memory.type === 'feature') {
    score += 10;
    reasons.push('feature priority');
  }

  if (recentlyUpdated(memory)) {
    score += 5;
    reasons.push('recent memory');
  }

  if (branch) {
    const branchText = branch.toLowerCase();
    const branchHaystack = `${memory.content} ${memory.tags.join(' ')}`.toLowerCase();
    if (branchHaystack.includes(branchText)) {
      score += 10;
      reasons.push(`current branch match: ${branch}`);
    }
  }

  return {
    memory,
    score,
    reasons: reasons.length > 0 ? reasons : ['closest available memory'],
  };
};

export const retrieveRelevantMemories = (
  memories: MemoryItem[],
  filePath: string,
  branch?: string,
  limit = 5
): ScoredMemory[] =>
  memories
    .map((memory) => scoreMemoryForFile(memory, filePath, branch))
    .sort(
      (left, right) => right.score - left.score || left.memory.id.localeCompare(right.memory.id)
    )
    .slice(0, limit);

export const memoryLabel = (content: string, maxLength = 80): string => {
  const compact = content.replace(/\s+/g, ' ').trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 3)}...` : compact;
};

const fileNodeId = (filePath: string): string =>
  `file_${normalizeFilePath(filePath)
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_|_$/g, '')}`;

const memoryNodeType = (type: MemoryType): string => type.charAt(0).toUpperCase() + type.slice(1);

const memoryEdgeType = (type: MemoryType): string => {
  if (type === 'rule') return 'RULE_APPLIES_TO_FILE';
  if (type === 'decision') return 'DECISION_AFFECTS_FILE';
  if (type === 'feature') return 'FEATURE_TOUCHES_FILE';
  if (type === 'prompt') return 'PROMPT_USES_MEMORY';
  return 'MEMORY_AFFECTS_FILE';
};

export const buildGraph = (
  config: MemoryConfig,
  memories: MemoryItem[],
  links: LinkRecord[]
): GraphData => {
  const nodes = new Map<string, { id: string; type: string; label: string; path?: string }>();
  const edges = new Map<string, { from: string; to: string; type: string }>();

  nodes.set('project_001', {
    id: 'project_001',
    type: 'Project',
    label: config.projectName || path.basename(config.rootPath),
  });

  memories.forEach((memory) => {
    nodes.set(memory.id, {
      id: memory.id,
      type: memoryNodeType(memory.type),
      label: memoryLabel(memory.content),
    });
    edges.set(`project_001-${memory.id}-PROJECT_HAS_MEMORY`, {
      from: 'project_001',
      to: memory.id,
      type: 'PROJECT_HAS_MEMORY',
    });

    memory.files.forEach((file) => {
      const normalized = normalizeFilePath(file);
      const nodeId = fileNodeId(normalized);
      nodes.set(nodeId, {
        id: nodeId,
        type: 'File',
        label: normalized,
        path: normalized,
      });
      edges.set(`${memory.id}-${nodeId}-${memoryEdgeType(memory.type)}`, {
        from: memory.id,
        to: nodeId,
        type: memoryEdgeType(memory.type),
      });
    });
  });

  links.forEach((link) => {
    const memory = memories.find((item) => item.id === link.memoryId);
    if (!memory) {
      return;
    }

    const normalized = normalizeFilePath(link.filePath);
    const nodeId = fileNodeId(normalized);
    nodes.set(nodeId, {
      id: nodeId,
      type: 'File',
      label: normalized,
      path: normalized,
    });
    edges.set(`${link.memoryId}-${nodeId}-${memoryEdgeType(memory.type)}`, {
      from: link.memoryId,
      to: nodeId,
      type: memoryEdgeType(memory.type),
    });
  });

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
};

const cypherEscape = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export const buildCypher = (
  config: MemoryConfig,
  memories: MemoryItem[],
  graph: GraphData
): string => {
  const lines: string[] = [
    `MERGE (p:Project {id: "project_001"}) SET p.name = "${cypherEscape(
      config.projectName
    )}", p.rootPath = "${cypherEscape(config.rootPath)}";`,
  ];

  memories.forEach((memory) => {
    lines.push(
      `MERGE (m:${memoryNodeType(memory.type)} {id: "${memory.id}"}) SET m.content = "${cypherEscape(
        memory.content
      )}", m.type = "${memory.type}";`
    );
  });

  graph.nodes
    .filter((node) => node.type === 'File')
    .forEach((node) => {
      lines.push(
        `MERGE (f:File {id: "${node.id}"}) SET f.path = "${cypherEscape(node.path || node.label)}";`
      );
    });

  graph.edges.forEach((edge) => {
    lines.push(
      `MATCH (a {id: "${edge.from}"}), (b {id: "${edge.to}"}) MERGE (a)-[:${edge.type}]->(b);`
    );
  });

  return `${lines.join('\n')}\n`;
};
