import { useCallback, useRef, useEffect } from 'react';
import { useGraphStore } from '../stores/graphStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useDocumentHistory } from './useDocumentHistory';
import type { Actor, Relation, Group, NodeTypeConfig, EdgeTypeConfig, LabelConfig, RelationData, GroupData } from '../types';

/**
 * useGraphWithHistory Hook
 *
 * ✅ USE THIS HOOK FOR ALL GRAPH MUTATIONS IN COMPONENTS ✅
 *
 * This hook wraps graph store operations with automatic document-level history tracking.
 * Every operation that modifies the graph pushes a complete document snapshot to the history stack,
 * enabling undo/redo functionality for both graph changes and timeline operations.
 *
 * ⚠️ IMPORTANT: Always use this hook instead of `useGraphStore()` in components
 * that modify graph state.
 *
 * History-tracked operations (saved to document-level history):
 * - Node operations: addNode, updateNode, deleteNode
 * - Edge operations: addEdge, updateEdge, deleteEdge
 * - Group operations: addGroup, updateGroup, deleteGroup, addActorToGroup, removeActorFromGroup
 * - Type operations: addNodeType, updateNodeType, deleteNodeType, addEdgeType, updateEdgeType, deleteEdgeType
 * - Label operations: addLabel, updateLabel, deleteLabel
 * - Utility: clearGraph
 *
 * Read-only pass-through operations (no history):
 * - setNodes, setEdges, setGroups, setLabels (used for bulk updates during undo/redo/document loading)
 * - nodes, edges, groups, nodeTypes, edgeTypes, labels (state access)
 * - loadGraphState
 *
 * Usage:
 *   const { addNode, updateNode, deleteNode, ... } = useGraphWithHistory();
 *
 *   // ✅ CORRECT: Uses history tracking
 *   addNode(newNode);
 *
 *   // ❌ WRONG: Bypasses history
 *   const graphStore = useGraphStore();
 *   graphStore.addNode(newNode);
 */
export function useGraphWithHistory() {
  const graphStore = useGraphStore();
  const activeDocumentId = useWorkspaceStore((state) => state.activeDocumentId);
  const addNodeTypeToDocument = useWorkspaceStore((state) => state.addNodeTypeToDocument);
  const updateNodeTypeInDocument = useWorkspaceStore((state) => state.updateNodeTypeInDocument);
  const deleteNodeTypeFromDocument = useWorkspaceStore((state) => state.deleteNodeTypeFromDocument);
  const addEdgeTypeToDocument = useWorkspaceStore((state) => state.addEdgeTypeToDocument);
  const updateEdgeTypeInDocument = useWorkspaceStore((state) => state.updateEdgeTypeInDocument);
  const deleteEdgeTypeFromDocument = useWorkspaceStore((state) => state.deleteEdgeTypeFromDocument);
  const addLabelToDocument = useWorkspaceStore((state) => state.addLabelToDocument);
  const updateLabelInDocument = useWorkspaceStore((state) => state.updateLabelInDocument);
  const deleteLabelFromDocument = useWorkspaceStore((state) => state.deleteLabelFromDocument);
  const { pushToHistory } = useDocumentHistory();

  // Track if we're currently restoring from history to prevent recursive history pushes
  const isRestoringRef = useRef(false);

  // Debounce timer for grouping rapid changes (like dragging)
  const debounceTimerRef = useRef<number | null>(null);
  const pendingActionRef = useRef<string | null>(null);

  // Helper to push history after a debounce delay
  const scheduleHistoryPush = useCallback(
    (description: string, delay = 300) => {
      if (isRestoringRef.current) return;

      // Store the description
      pendingActionRef.current = description;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = window.setTimeout(() => {
        if (pendingActionRef.current) {
          pushToHistory(pendingActionRef.current);
          pendingActionRef.current = null;
        }
        debounceTimerRef.current = null;
      }, delay);
    },
    [pushToHistory]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Wrapped operations

  const addNode = useCallback(
    (node: Actor) => {
      if (isRestoringRef.current) {
        graphStore.addNode(node);
        return;
      }
      const nodeType = graphStore.nodeTypes.find((nt) => nt.id === node.data.type);
      pushToHistory(`Add ${nodeType?.label || 'Actor'}`); // Synchronous push BEFORE mutation
      graphStore.addNode(node);
    },
    [graphStore, pushToHistory]
  );

  const updateNode = useCallback(
    (id: string, updates: Partial<Actor>) => {
      if (isRestoringRef.current) {
        graphStore.updateNode(id, updates);
        return;
      }
      // Check if this is a position update (node move)
      if (updates.position) {
        scheduleHistoryPush('Move Actor', 500); // Debounced for dragging
        graphStore.updateNode(id, updates);
      } else {
        pushToHistory('Update Actor'); // Synchronous push BEFORE mutation
        graphStore.updateNode(id, updates);
      }
    },
    [graphStore, scheduleHistoryPush, pushToHistory]
  );

  const deleteNode = useCallback(
    (id: string) => {
      if (isRestoringRef.current) {
        graphStore.deleteNode(id);
        return;
      }
      const node = graphStore.nodes.find((n) => n.id === id);
      const nodeType = graphStore.nodeTypes.find((nt) => nt.id === node?.data.type);
      pushToHistory(`Delete ${nodeType?.label || 'Actor'}`); // Synchronous push BEFORE mutation
      graphStore.deleteNode(id);
    },
    [graphStore, pushToHistory]
  );

  const addEdge = useCallback(
    (edge: Relation) => {
      if (isRestoringRef.current) {
        graphStore.addEdge(edge);
        return;
      }
      const edgeType = graphStore.edgeTypes.find((et) => et.id === edge.data?.type);
      pushToHistory(`Add ${edgeType?.label || 'Relation'}`); // Synchronous push BEFORE mutation
      graphStore.addEdge(edge);
    },
    [graphStore, pushToHistory]
  );

  const updateEdge = useCallback(
    (id: string, data: Partial<RelationData>) => {
      if (isRestoringRef.current) {
        graphStore.updateEdge(id, data);
        return;
      }
      pushToHistory('Update Relation'); // Synchronous push BEFORE mutation
      graphStore.updateEdge(id, data);
    },
    [graphStore, pushToHistory]
  );

  const deleteEdge = useCallback(
    (id: string) => {
      if (isRestoringRef.current) {
        graphStore.deleteEdge(id);
        return;
      }
      const edge = graphStore.edges.find((e) => e.id === id);
      const edgeType = graphStore.edgeTypes.find((et) => et.id === edge?.data?.type);
      pushToHistory(`Delete ${edgeType?.label || 'Relation'}`); // Synchronous push BEFORE mutation
      graphStore.deleteEdge(id);
    },
    [graphStore, pushToHistory]
  );

  const addNodeType = useCallback(
    (nodeType: NodeTypeConfig) => {
      if (!activeDocumentId) {
        console.warn('No active document');
        return;
      }
      if (isRestoringRef.current) {
        graphStore.addNodeType(nodeType);
        return;
      }
      pushToHistory(`Add Node Type: ${nodeType.label}`); // Synchronous push BEFORE mutation
      addNodeTypeToDocument(activeDocumentId, nodeType);
    },
    [activeDocumentId, graphStore, pushToHistory, addNodeTypeToDocument]
  );

  const updateNodeType = useCallback(
    (id: string, updates: Partial<Omit<NodeTypeConfig, 'id'>>) => {
      if (!activeDocumentId) {
        console.warn('No active document');
        return;
      }
      if (isRestoringRef.current) {
        graphStore.updateNodeType(id, updates);
        return;
      }
      pushToHistory('Update Node Type'); // Synchronous push BEFORE mutation
      updateNodeTypeInDocument(activeDocumentId, id, updates);
    },
    [activeDocumentId, graphStore, pushToHistory, updateNodeTypeInDocument]
  );

  const deleteNodeType = useCallback(
    (id: string) => {
      if (!activeDocumentId) {
        console.warn('No active document');
        return;
      }
      if (isRestoringRef.current) {
        graphStore.deleteNodeType(id);
        return;
      }
      const nodeType = graphStore.nodeTypes.find((nt) => nt.id === id);
      pushToHistory(`Delete Node Type: ${nodeType?.label || id}`); // Synchronous push BEFORE mutation
      deleteNodeTypeFromDocument(activeDocumentId, id);
    },
    [activeDocumentId, graphStore, pushToHistory, deleteNodeTypeFromDocument]
  );

  const addEdgeType = useCallback(
    (edgeType: EdgeTypeConfig) => {
      if (!activeDocumentId) {
        console.warn('No active document');
        return;
      }
      if (isRestoringRef.current) {
        graphStore.addEdgeType(edgeType);
        return;
      }
      pushToHistory(`Add Edge Type: ${edgeType.label}`); // Synchronous push BEFORE mutation
      addEdgeTypeToDocument(activeDocumentId, edgeType);
    },
    [activeDocumentId, graphStore, pushToHistory, addEdgeTypeToDocument]
  );

  const updateEdgeType = useCallback(
    (id: string, updates: Partial<Omit<EdgeTypeConfig, 'id'>>) => {
      if (!activeDocumentId) {
        console.warn('No active document');
        return;
      }
      if (isRestoringRef.current) {
        graphStore.updateEdgeType(id, updates);
        return;
      }
      pushToHistory('Update Edge Type'); // Synchronous push BEFORE mutation
      updateEdgeTypeInDocument(activeDocumentId, id, updates);
    },
    [activeDocumentId, graphStore, pushToHistory, updateEdgeTypeInDocument]
  );

  const deleteEdgeType = useCallback(
    (id: string) => {
      if (!activeDocumentId) {
        console.warn('No active document');
        return;
      }
      if (isRestoringRef.current) {
        graphStore.deleteEdgeType(id);
        return;
      }
      const edgeType = graphStore.edgeTypes.find((et) => et.id === id);
      pushToHistory(`Delete Edge Type: ${edgeType?.label || id}`); // Synchronous push BEFORE mutation
      deleteEdgeTypeFromDocument(activeDocumentId, id);
    },
    [activeDocumentId, graphStore, pushToHistory, deleteEdgeTypeFromDocument]
  );

  const clearGraph = useCallback(
    () => {
      if (isRestoringRef.current) {
        graphStore.clearGraph();
        return;
      }
      pushToHistory('Clear Graph'); // Synchronous push BEFORE mutation
      graphStore.clearGraph();
    },
    [graphStore, pushToHistory]
  );

  const addLabel = useCallback(
    (label: LabelConfig) => {
      if (!activeDocumentId) {
        console.warn('No active document');
        return;
      }
      if (isRestoringRef.current) {
        graphStore.addLabel(label);
        return;
      }
      pushToHistory(`Add Label: ${label.name}`); // Synchronous push BEFORE mutation
      addLabelToDocument(activeDocumentId, label);
    },
    [activeDocumentId, graphStore, pushToHistory, addLabelToDocument]
  );

  const updateLabel = useCallback(
    (id: string, updates: Partial<Omit<LabelConfig, 'id'>>) => {
      if (!activeDocumentId) {
        console.warn('No active document');
        return;
      }
      if (isRestoringRef.current) {
        graphStore.updateLabel(id, updates);
        return;
      }
      pushToHistory('Update Label'); // Synchronous push BEFORE mutation
      updateLabelInDocument(activeDocumentId, id, updates);
    },
    [activeDocumentId, graphStore, pushToHistory, updateLabelInDocument]
  );

  const deleteLabel = useCallback(
    (id: string) => {
      if (!activeDocumentId) {
        console.warn('No active document');
        return;
      }
      if (isRestoringRef.current) {
        graphStore.deleteLabel(id);
        return;
      }
      const label = graphStore.labels.find((l) => l.id === id);
      pushToHistory(`Delete Label: ${label?.name || id}`); // Synchronous push BEFORE mutation
      deleteLabelFromDocument(activeDocumentId, id);
    },
    [activeDocumentId, graphStore, pushToHistory, deleteLabelFromDocument]
  );

  // Group operations
  const addGroup = useCallback(
    (group: Group) => {
      if (isRestoringRef.current) {
        graphStore.addGroup(group);
        return;
      }
      pushToHistory(`Create Group: ${group.data.label}`); // Synchronous push BEFORE mutation
      graphStore.addGroup(group);
    },
    [graphStore, pushToHistory]
  );

  const updateGroup = useCallback(
    (id: string, updates: Partial<GroupData>) => {
      if (isRestoringRef.current) {
        graphStore.updateGroup(id, updates);
        return;
      }
      // Check if this is a position update (group move)
      if ('collapsed' in updates) {
        const group = graphStore.groups.find((g) => g.id === id);
        pushToHistory(updates.collapsed ? `Collapse Group: ${group?.data.label}` : `Expand Group: ${group?.data.label}`);
      } else if ('label' in updates) {
        pushToHistory('Rename Group');
      } else {
        pushToHistory('Update Group');
      }
      graphStore.updateGroup(id, updates);
    },
    [graphStore, pushToHistory]
  );

  const deleteGroup = useCallback(
    (id: string, ungroupActors = true) => {
      if (isRestoringRef.current) {
        graphStore.deleteGroup(id, ungroupActors);
        return;
      }
      const group = graphStore.groups.find((g) => g.id === id);
      pushToHistory(ungroupActors ? `Ungroup: ${group?.data.label}` : `Delete Group: ${group?.data.label}`);
      graphStore.deleteGroup(id, ungroupActors);
    },
    [graphStore, pushToHistory]
  );

  const addActorToGroup = useCallback(
    (actorId: string, groupId: string) => {
      if (isRestoringRef.current) {
        graphStore.addActorToGroup(actorId, groupId);
        return;
      }
      const group = graphStore.groups.find((g) => g.id === groupId);
      pushToHistory(`Add Actor to Group: ${group?.data.label}`);
      graphStore.addActorToGroup(actorId, groupId);
    },
    [graphStore, pushToHistory]
  );

  const removeActorFromGroup = useCallback(
    (actorId: string, groupId: string) => {
      if (isRestoringRef.current) {
        graphStore.removeActorFromGroup(actorId, groupId);
        return;
      }
      const group = graphStore.groups.find((g) => g.id === groupId);
      pushToHistory(`Remove Actor from Group: ${group?.data.label}`);
      graphStore.removeActorFromGroup(actorId, groupId);
    },
    [graphStore, pushToHistory]
  );

  const toggleGroupMinimized = useCallback(
    (groupId: string) => {
      if (isRestoringRef.current) {
        graphStore.toggleGroupMinimized(groupId);
        return;
      }
      const group = graphStore.groups.find((g) => g.id === groupId);
      const action = group?.data.minimized ? 'Maximize' : 'Minimize';
      pushToHistory(`${action} Group: ${group?.data.label}`);
      graphStore.toggleGroupMinimized(groupId);
    },
    [graphStore, pushToHistory]
  );

  /**
   * createGroupWithActors - Atomic operation to create a group and add actors to it
   *
   * This operation ensures that both the group creation and the actor parent relationship
   * updates are captured in a single history snapshot. This prevents the "Parent node not found"
   * error that occurs when these are tracked as separate operations.
   *
   * @param group - The group node to create
   * @param actorIds - Array of actor IDs to add to the group
   * @param actorUpdates - Map of actorId -> position/parentId updates for each actor
   */
  const createGroupWithActors = useCallback(
    (
      group: Group,
      _actorIds: string[],
      actorUpdates: Record<string, { position: { x: number; y: number }; parentId: string; extent: 'parent' }>
    ) => {
      if (isRestoringRef.current) {
        graphStore.addGroup(group);
        const updatedNodes = graphStore.nodes.map((node) => {
          const update = actorUpdates[node.id];
          return update ? { ...node, ...update } : node;
        });
        graphStore.setNodes(updatedNodes as Actor[]);
        return;
      }

      // ✅ Push history BEFORE making changes (consistent with other operations)
      // This captures the state WITHOUT the group, so undo will correctly restore it
      pushToHistory(`Create Group: ${group.data.label}`);

      // Add the group first
      graphStore.addGroup(group);

      // Update actors to be children of the group
      const updatedNodes = graphStore.nodes.map((node) => {
        const update = actorUpdates[node.id];
        return update ? { ...node, ...update } : node;
      });

      // Update nodes in store
      graphStore.setNodes(updatedNodes as Actor[]);
    },
    [graphStore, pushToHistory]
  );

  return {
    // Wrapped operations with history
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    addGroup,
    updateGroup,
    deleteGroup,
    addActorToGroup,
    removeActorFromGroup,
    toggleGroupMinimized,
    createGroupWithActors,
    addNodeType,
    updateNodeType,
    deleteNodeType,
    addEdgeType,
    updateEdgeType,
    deleteEdgeType,
    addLabel,
    updateLabel,
    deleteLabel,
    clearGraph,

    // Pass through read-only operations
    nodes: graphStore.nodes,
    edges: graphStore.edges,
    groups: graphStore.groups,
    nodeTypes: graphStore.nodeTypes,
    edgeTypes: graphStore.edgeTypes,
    labels: graphStore.labels,
    setNodes: graphStore.setNodes,
    setEdges: graphStore.setEdges,
    setGroups: graphStore.setGroups,
    setNodeTypes: graphStore.setNodeTypes,
    setEdgeTypes: graphStore.setEdgeTypes,
    setLabels: graphStore.setLabels,
    loadGraphState: graphStore.loadGraphState,

    // NOTE: exportToFile and importFromFile have been removed
    // Import/export is now handled by the workspace-level system (useWorkspaceStore)

    // Expose flag for detecting restore operations
    isRestoringRef,
  };
}
