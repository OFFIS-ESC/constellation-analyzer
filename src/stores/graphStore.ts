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
import { persistenceMiddleware } from './persistence/middleware';
import { loadGraphState } from './persistence/loader';
import { exportGraphToFile, selectFileForImport } from './persistence/fileIO';

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

// Default node types
const defaultNodeTypes: NodeTypeConfig[] = [
  { id: 'person', label: 'Person', color: '#3b82f6', icon: 'Person', description: 'Individual person' },
  { id: 'organization', label: 'Organization', color: '#10b981', icon: 'Business', description: 'Company or group' },
  { id: 'system', label: 'System', color: '#f59e0b', icon: 'Computer', description: 'Technical system' },
  { id: 'concept', label: 'Concept', color: '#8b5cf6', icon: 'Lightbulb', description: 'Abstract concept' },
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

export const useGraphStore = create<GraphStore & GraphActions>(
  persistenceMiddleware((set) => ({
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

  // File import/export operations
  exportToFile: () => {
    const state = useGraphStore.getState();
    exportGraphToFile(state.nodes, state.edges, state.nodeTypes, state.edgeTypes);
  },

  importFromFile: (onError?: (error: string) => void) => {
    selectFileForImport(
      (data) => {
        // Load the imported data into the store
        set({
          nodes: data.nodes,
          edges: data.edges,
          nodeTypes: data.nodeTypes,
          edgeTypes: data.edgeTypes,
        });
      },
      (error) => {
        console.error('Import failed:', error);
        if (onError) {
          onError(error);
        } else {
          alert(`Failed to import file: ${error}`);
        }
      }
    );
  },

  loadGraphState: (data) =>
    set({
      nodes: data.nodes,
      edges: data.edges,
      nodeTypes: data.nodeTypes,
      edgeTypes: data.edgeTypes,
    }),
})));
