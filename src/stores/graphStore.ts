import { create } from 'zustand';
import { addEdge as rfAddEdge } from 'reactflow';
import type {
  Actor,
  Relation,
  NodeTypeConfig,
  EdgeTypeConfig,
  RelationData,
  GraphActions
} from '../types';
import { loadGraphState } from './persistence/loader';

/**
 * ⚠️ IMPORTANT: DO NOT USE THIS STORE DIRECTLY IN COMPONENTS ⚠️
 *
 * This is the low-level graph store. All mutation operations should go through
 * the `useGraphWithHistory` hook to ensure undo/redo history is tracked.
 *
 * ✅ CORRECT: Use `useGraphWithHistory()` in components
 * ❌ WRONG: Use `useGraphStore()` directly (bypasses history tracking)
 *
 * Exception: Read-only access in presentation components (CustomNode, CustomEdge)
 * is acceptable.
 *
 * See: src/hooks/useGraphWithHistory.ts
 */
interface GraphStore {
  nodes: Actor[];
  edges: Relation[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
}

// Default node types with semantic shape assignments
const defaultNodeTypes: NodeTypeConfig[] = [
  { id: 'person', label: 'Person', color: '#3b82f6', shape: 'circle', icon: 'Person', description: 'Individual person' },
  { id: 'organization', label: 'Organization', color: '#10b981', shape: 'rectangle', icon: 'Business', description: 'Company or group' },
  { id: 'system', label: 'System', color: '#f59e0b', shape: 'roundedRectangle', icon: 'Computer', description: 'Technical system' },
  { id: 'concept', label: 'Concept', color: '#8b5cf6', shape: 'roundedRectangle', icon: 'Lightbulb', description: 'Abstract concept' },
];

// Default edge types
const defaultEdgeTypes: EdgeTypeConfig[] = [
  { id: 'collaborates', label: 'Collaborates', color: '#3b82f6', style: 'solid' },
  { id: 'reports-to', label: 'Reports To', color: '#10b981', style: 'solid' },
  { id: 'depends-on', label: 'Depends On', color: '#f59e0b', style: 'dashed' },
  { id: 'influences', label: 'Influences', color: '#8b5cf6', style: 'dotted' },
];

// Load initial state from localStorage or use defaults
const loadInitialState = (): GraphStore => {
  const savedState = loadGraphState();

  if (savedState) {
    return {
      nodes: savedState.nodes,
      edges: savedState.edges,
      nodeTypes: savedState.nodeTypes,
      edgeTypes: savedState.edgeTypes,
    };
  }

  return {
    nodes: [],
    edges: [],
    nodeTypes: defaultNodeTypes,
    edgeTypes: defaultEdgeTypes,
  };
};

const initialState = loadInitialState();

export const useGraphStore = create<GraphStore & GraphActions>((set) => ({
  nodes: initialState.nodes,
  edges: initialState.edges,
  nodeTypes: initialState.nodeTypes,
  edgeTypes: initialState.edgeTypes,

  // Node operations
  addNode: (node: Actor) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (id: string, updates: Partial<Actor>) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              ...updates,
              data: updates.data ? { ...node.data, ...updates.data } : node.data,
            }
          : node
      ),
    })),

  deleteNode: (id: string) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
    })),

  // Edge operations
  addEdge: (edge: Relation) =>
    set((state) => ({
      edges: rfAddEdge(edge, state.edges) as Relation[],
    })),

  updateEdge: (id: string, data: Partial<RelationData>) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data, ...data } as RelationData }
          : edge
      ),
    })),

  deleteEdge: (id: string) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    })),

  // Node type operations
  addNodeType: (nodeType: NodeTypeConfig) =>
    set((state) => ({
      nodeTypes: [...state.nodeTypes, nodeType],
    })),

  updateNodeType: (id: string, updates: Partial<Omit<NodeTypeConfig, 'id'>>) =>
    set((state) => ({
      nodeTypes: state.nodeTypes.map((type) =>
        type.id === id ? { ...type, ...updates } : type
      ),
    })),

  deleteNodeType: (id: string) =>
    set((state) => ({
      nodeTypes: state.nodeTypes.filter((type) => type.id !== id),
    })),

  // Edge type operations
  addEdgeType: (edgeType: EdgeTypeConfig) =>
    set((state) => ({
      edgeTypes: [...state.edgeTypes, edgeType],
    })),

  updateEdgeType: (id: string, updates: Partial<Omit<EdgeTypeConfig, 'id'>>) =>
    set((state) => ({
      edgeTypes: state.edgeTypes.map((type) =>
        type.id === id ? { ...type, ...updates } : type
      ),
    })),

  deleteEdgeType: (id: string) =>
    set((state) => ({
      edgeTypes: state.edgeTypes.filter((type) => type.id !== id),
    })),

  // Utility operations
  clearGraph: () =>
    set({
      nodes: [],
      edges: [],
    }),

  setNodes: (nodes: Actor[]) =>
    set({
      nodes,
    }),

  setEdges: (edges: Relation[]) =>
    set({
      edges,
    }),

  setNodeTypes: (nodeTypes: NodeTypeConfig[]) =>
    set({
      nodeTypes,
    }),

  setEdgeTypes: (edgeTypes: EdgeTypeConfig[]) =>
    set({
      edgeTypes,
    }),

  // NOTE: exportToFile and importFromFile have been removed
  // Import/export is now handled by the workspace-level system
  // See: workspaceStore.importDocumentFromFile() and workspaceStore.exportDocument()

  loadGraphState: (data) =>
    set({
      nodes: data.nodes,
      edges: data.edges,
      nodeTypes: data.nodeTypes,
      edgeTypes: data.edgeTypes,
    }),
}));
