import fs from 'fs';
import path from 'path';
import {
  buildCypher,
  buildGraph,
  createMemoryConfig,
  ensureMemoryWorkspace,
  getConfigPath,
  getGraphPath,
  readJsonSafe,
  readLinks,
  readMemories,
  writeJsonSafe,
  MemoryConfig,
} from '../services/memory';

interface GraphOptions {
  format?: string;
}

export const graphCommand = (options: GraphOptions) => {
  const vibeforgeDir = ensureMemoryWorkspace();
  const config = readJsonSafe<MemoryConfig>(getConfigPath(vibeforgeDir), createMemoryConfig());
  const memories = readMemories(vibeforgeDir);
  const links = readLinks(vibeforgeDir);
  const graph = buildGraph(config, memories, links);
  const graphPath = getGraphPath(vibeforgeDir);

  writeJsonSafe(graphPath, graph);
  console.log(`Graph exported to ${graphPath}`);
  console.log(`Nodes: ${graph.nodes.length} | Edges: ${graph.edges.length}`);

  if (options.format === 'cypher') {
    const cypherPath = path.join(vibeforgeDir, 'graph.cypher');
    fs.writeFileSync(cypherPath, buildCypher(config, memories, graph));
    console.log(`Cypher exported to ${cypherPath}`);
  }
};
