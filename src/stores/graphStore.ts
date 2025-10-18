import { create } from 'zustand';
import { addEdge as rfAddEdge } from 'reactflow';
import type {
  Actor,
  Relation,
  Group,
  NodeTypeConfig,
  EdgeTypeConfig,
  LabelConfig,
  RelationData,
  GroupData,
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
  groups: Group[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  labels: LabelConfig[];
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
      groups: savedState.groups || [],
      nodeTypes: savedState.nodeTypes,
      edgeTypes: savedState.edgeTypes,
      labels: savedState.labels || [],
    };
  }

  return {
    nodes: [],
    edges: [],
    groups: [],
    nodeTypes: defaultNodeTypes,
    edgeTypes: defaultEdgeTypes,
    labels: [],
  };
};

const initialState = loadInitialState();

export const useGraphStore = create<GraphStore & GraphActions>((set) => ({
  nodes: initialState.nodes,
  edges: initialState.edges,
  groups: initialState.groups,
  nodeTypes: initialState.nodeTypes,
  edgeTypes: initialState.edgeTypes,
  labels: initialState.labels,

  // Node operations
  addNode: (node: Actor) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (id: string, updates: Partial<Actor>) =>
    set((state) => {
      // Validate and filter labels if present
      let validatedData = updates.data;
      if (updates.data?.labels) {
        const validLabelIds = new Set(state.labels.map((l) => l.id));
        const filteredLabels = updates.data.labels.filter((labelId) =>
          validLabelIds.has(labelId)
        );
        validatedData = {
          ...updates.data,
          labels: filteredLabels.length > 0 ? filteredLabels : undefined,
        };
      }

      return {
        nodes: state.nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                ...updates,
                data: validatedData ? { ...node.data, ...validatedData } : node.data,
              }
            : node
        ),
      };
    }),

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
    set((state) => {
      // Validate and filter labels if present
      let validatedData = data;
      if (data.labels) {
        const validLabelIds = new Set(state.labels.map((l) => l.id));
        const filteredLabels = data.labels.filter((labelId) =>
          validLabelIds.has(labelId)
        );
        validatedData = {
          ...data,
          labels: filteredLabels.length > 0 ? filteredLabels : undefined,
        };
      }

      return {
        edges: state.edges.map((edge) =>
          edge.id === id
            ? { ...edge, data: { ...edge.data, ...validatedData } as RelationData }
            : edge
        ),
      };
    }),

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

  // Label operations
  addLabel: (label: LabelConfig) =>
    set((state) => ({
      labels: [...state.labels, label],
    })),

  updateLabel: (id: string, updates: Partial<Omit<LabelConfig, 'id'>>) =>
    set((state) => ({
      labels: state.labels.map((label) =>
        label.id === id ? { ...label, ...updates } : label
      ),
    })),

  deleteLabel: (id: string) =>
    set((state) => {
      // Remove label from all nodes and edges
      const updatedNodes = state.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          labels: node.data.labels?.filter((labelId) => labelId !== id),
        },
      }));

      const updatedEdges = state.edges.map((edge) => ({
        ...edge,
        data: edge.data
          ? {
              ...edge.data,
              labels: edge.data.labels?.filter((labelId) => labelId !== id),
            }
          : edge.data,
      }));

      return {
        labels: state.labels.filter((label) => label.id !== id),
        nodes: updatedNodes,
        edges: updatedEdges,
      };
    }),

  // Group operations
  addGroup: (group: Group) =>
    set((state) => ({
      groups: [...state.groups, group],
    })),

  updateGroup: (id: string, updates: Partial<GroupData>) =>
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === id
          ? { ...group, data: { ...group.data, ...updates } }
          : group
      ),
    })),

  deleteGroup: (id: string, ungroupActors = true) =>
    set((state) => {
      if (ungroupActors) {
        // Remove group and unparent actors (move them back to canvas)
        // Note: parentId is a React Flow v11+ property for parent-child relationships
        const updatedNodes = state.nodes.map((node) => {
          const nodeWithParent = node as Actor & { parentId?: string; extent?: 'parent' };
          return nodeWithParent.parentId === id
            ? { ...node, parentId: undefined, extent: undefined }
            : node;
        });

        return {
          groups: state.groups.filter((group) => group.id !== id),
          nodes: updatedNodes,
        };
      } else {
        // Delete group AND all actors inside
        const nodeWithParent = (node: Actor) => node as Actor & { parentId?: string };
        const updatedNodes = state.nodes.filter((node) => nodeWithParent(node).parentId !== id);

        // Delete all edges connected to deleted actors
        const deletedNodeIds = new Set(
          state.nodes.filter((node) => nodeWithParent(node).parentId === id).map((node) => node.id)
        );
        const updatedEdges = state.edges.filter(
          (edge) => !deletedNodeIds.has(edge.source) && !deletedNodeIds.has(edge.target)
        );

        return {
          groups: state.groups.filter((group) => group.id !== id),
          nodes: updatedNodes,
          edges: updatedEdges,
        };
      }
    }),

  addActorToGroup: (actorId: string, groupId: string) =>
    set((state) => {
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) return state;

      // Update actor to be child of group
      const updatedNodes = state.nodes.map((node) =>
        node.id === actorId
          ? {
              ...node,
              parentId: groupId,
              extent: 'parent' as const,
              // Convert to relative position (will be adjusted in component)
              position: node.position,
            }
          : node
      );

      // Update group's actorIds
      const updatedGroups = state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              data: {
                ...g.data,
                actorIds: [...g.data.actorIds, actorId],
              },
            }
          : g
      );

      return {
        nodes: updatedNodes,
        groups: updatedGroups,
      };
    }),

  removeActorFromGroup: (actorId: string, groupId: string) =>
    set((state) => {
      // Update actor to remove parent
      const updatedNodes = state.nodes.map((node) =>
        node.id === actorId
          ? {
              ...node,
              parentId: undefined,
              extent: undefined,
              // Keep current position (will be adjusted in component)
            }
          : node
      );

      // Update group's actorIds
      const updatedGroups = state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              data: {
                ...g.data,
                actorIds: g.data.actorIds.filter((id) => id !== actorId),
              },
            }
          : g
      );

      return {
        nodes: updatedNodes,
        groups: updatedGroups,
      };
    }),

  // Utility operations
  clearGraph: () =>
    set({
      nodes: [],
      edges: [],
      groups: [],
    }),

  setNodes: (nodes: Actor[]) =>
    set({
      nodes,
    }),

  setEdges: (edges: Relation[]) =>
    set({
      edges,
    }),

  setGroups: (groups: Group[]) =>
    set({
      groups,
    }),

  setNodeTypes: (nodeTypes: NodeTypeConfig[]) =>
    set({
      nodeTypes,
    }),

  setEdgeTypes: (edgeTypes: EdgeTypeConfig[]) =>
    set({
      edgeTypes,
    }),

  setLabels: (labels: LabelConfig[]) =>
    set({
      labels,
    }),

  // NOTE: exportToFile and importFromFile have been removed
  // Import/export is now handled by the workspace-level system
  // See: workspaceStore.importDocumentFromFile() and workspaceStore.exportDocument()

  loadGraphState: (data) => {
    // Build set of valid group IDs to check for orphaned parentId references
    const validGroupIds = new Set((data.groups || []).map((g) => g.id));

    // Sanitize nodes - remove parentId if the referenced group doesn't exist
    // This handles timeline states created before groups feature was implemented
    const sanitizedNodes = data.nodes.map((node) => {
      const nodeWithParent = node as Actor & { parentId?: string; extent?: 'parent' };
      if (nodeWithParent.parentId && !validGroupIds.has(nodeWithParent.parentId)) {
        // Remove orphaned parent reference
        const { parentId, extent, ...cleanNode } = nodeWithParent;
        return cleanNode as Actor;
      }
      return node;
    });

    // Atomic update: all state changes happen in a single set() call
    set({
      nodes: sanitizedNodes,
      edges: data.edges,
      groups: data.groups || [],
      nodeTypes: data.nodeTypes,
      edgeTypes: data.edgeTypes,
      labels: data.labels || [],
    });
  },
}));
