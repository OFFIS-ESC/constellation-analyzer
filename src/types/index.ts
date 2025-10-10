import { Node, Edge } from 'reactflow';

// Node/Actor Types
export interface ActorData {
  label: string;
  type: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export type Actor = Node<ActorData>;

// Edge/Relation Types
export interface RelationData {
  label?: string;
  type: string;
  strength?: number;
  metadata?: Record<string, unknown>;
}

export type Relation = Edge<RelationData>;

// Node Type Configuration
export interface NodeTypeConfig {
  id: string;
  label: string;
  color: string;
  icon?: string;
  description?: string;
}

// Edge Type Configuration
export interface EdgeTypeConfig {
  id: string;
  label: string;
  color: string;
  style?: 'solid' | 'dashed' | 'dotted';
  description?: string;
}

// Graph State
export interface GraphState {
  nodes: Actor[];
  edges: Relation[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
}

// Editor Settings
export interface EditorSettings {
  snapToGrid: boolean;
  showGrid: boolean;
  gridSize: number;
  panOnDrag: boolean;
  zoomOnScroll: boolean;
}

// Store Actions
export interface GraphActions {
  addNode: (node: Actor) => void;
  updateNode: (id: string, updates: Partial<Actor>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Relation) => void;
  updateEdge: (id: string, data: Partial<RelationData>) => void;
  deleteEdge: (id: string) => void;
  addNodeType: (nodeType: NodeTypeConfig) => void;
  updateNodeType: (id: string, updates: Partial<Omit<NodeTypeConfig, 'id'>>) => void;
  deleteNodeType: (id: string) => void;
  addEdgeType: (edgeType: EdgeTypeConfig) => void;
  updateEdgeType: (id: string, updates: Partial<Omit<EdgeTypeConfig, 'id'>>) => void;
  deleteEdgeType: (id: string) => void;
  clearGraph: () => void;
  setNodes: (nodes: Actor[]) => void;
  setEdges: (edges: Relation[]) => void;
  setNodeTypes: (nodeTypes: NodeTypeConfig[]) => void;
  setEdgeTypes: (edgeTypes: EdgeTypeConfig[]) => void;
  exportToFile: () => void;
  importFromFile: (onError?: (error: string) => void) => void;
  loadGraphState: (data: { nodes: Actor[]; edges: Relation[]; nodeTypes: NodeTypeConfig[]; edgeTypes: EdgeTypeConfig[] }) => void;
}

export interface EditorActions {
  updateSettings: (settings: Partial<EditorSettings>) => void;
}
