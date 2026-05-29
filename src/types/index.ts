export interface RecordMeta {
  id: string;
  timestamp: string;
  targetPath: string;
  type: string;
}

export interface CodegraphNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  children?: CodegraphNode[];
}
