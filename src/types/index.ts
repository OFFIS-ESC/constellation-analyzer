import { Node, Edge } from 'reactflow';

// Node/Actor Types
export interface ActorData {
  label: string;
  type: string;
  description?: string;
  labels?: string[];  // Array of LabelConfig IDs
  citations?: string[];  // Array of bibliography reference IDs
  metadata?: Record<string, unknown>;
}

export type Actor = Node<ActorData>;

// Edge/Relation Types
export type EdgeDirectionality = 'directed' | 'bidirectional' | 'undirected';

export interface RelationData {
  label?: string;
  type: string;
  directionality?: EdgeDirectionality;
  strength?: number;
  labels?: string[];  // Array of LabelConfig IDs
  citations?: string[];  // Array of bibliography reference IDs
  metadata?: Record<string, unknown>;
}

export type Relation = Edge<RelationData>;

// Node Shape Types
export type NodeShape =
  | 'rectangle'
  | 'circle'
  | 'roundedRectangle'
  | 'ellipse'
  | 'pill';

// Node Type Configuration
export interface NodeTypeConfig {
  id: string;
  label: string;
  color: string;
  shape: NodeShape;
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
  defaultDirectionality?: EdgeDirectionality;
}

// Label Configuration
export type LabelScope = 'actors' | 'relations' | 'both';

export interface LabelConfig {
  id: string;
  name: string;
  color: string;
  appliesTo: LabelScope;
  description?: string;
}

// Graph State
export interface GraphState {
  nodes: Actor[];
  edges: Relation[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  labels: LabelConfig[];
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
  addLabel: (label: LabelConfig) => void;
  updateLabel: (id: string, updates: Partial<Omit<LabelConfig, 'id'>>) => void;
  deleteLabel: (id: string) => void;
  clearGraph: () => void;
  setNodes: (nodes: Actor[]) => void;
  setEdges: (edges: Relation[]) => void;
  setNodeTypes: (nodeTypes: NodeTypeConfig[]) => void;
  setEdgeTypes: (edgeTypes: EdgeTypeConfig[]) => void;
  setLabels: (labels: LabelConfig[]) => void;
  // NOTE: exportToFile and importFromFile have been removed
  // Import/export is now handled by the workspace-level system (workspaceStore)
  loadGraphState: (data: { nodes: Actor[]; edges: Relation[]; nodeTypes: NodeTypeConfig[]; edgeTypes: EdgeTypeConfig[]; labels?: LabelConfig[] }) => void;
}

export interface EditorActions {
  updateSettings: (settings: Partial<EditorSettings>) => void;
}
