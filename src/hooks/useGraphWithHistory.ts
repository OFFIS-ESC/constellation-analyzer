import { useCallback, useRef, useEffect } from 'react';
import { useGraphStore } from '../stores/graphStore';
import { useDocumentHistory } from './useDocumentHistory';
import type { Actor, Relation, NodeTypeConfig, EdgeTypeConfig, RelationData } from '../types';

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
 * - Type operations: addNodeType, updateNodeType, deleteNodeType, addEdgeType, updateEdgeType, deleteEdgeType
 * - Utility: clearGraph
 *
 * Read-only pass-through operations (no history):
 * - setNodes, setEdges (used for bulk updates during undo/redo/document loading)
 * - nodes, edges, nodeTypes, edgeTypes (state access)
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
      if (isRestoringRef.current) {
        graphStore.addNodeType(nodeType);
        return;
      }
      pushToHistory(`Add Node Type: ${nodeType.label}`); // Synchronous push BEFORE mutation
      graphStore.addNodeType(nodeType);
    },
    [graphStore, pushToHistory]
  );

  const updateNodeType = useCallback(
    (id: string, updates: Partial<Omit<NodeTypeConfig, 'id'>>) => {
      if (isRestoringRef.current) {
        graphStore.updateNodeType(id, updates);
        return;
      }
      pushToHistory('Update Node Type'); // Synchronous push BEFORE mutation
      graphStore.updateNodeType(id, updates);
    },
    [graphStore, pushToHistory]
  );

  const deleteNodeType = useCallback(
    (id: string) => {
      if (isRestoringRef.current) {
        graphStore.deleteNodeType(id);
        return;
      }
      const nodeType = graphStore.nodeTypes.find((nt) => nt.id === id);
      pushToHistory(`Delete Node Type: ${nodeType?.label || id}`); // Synchronous push BEFORE mutation
      graphStore.deleteNodeType(id);
    },
    [graphStore, pushToHistory]
  );

  const addEdgeType = useCallback(
    (edgeType: EdgeTypeConfig) => {
      if (isRestoringRef.current) {
        graphStore.addEdgeType(edgeType);
        return;
      }
      pushToHistory(`Add Edge Type: ${edgeType.label}`); // Synchronous push BEFORE mutation
      graphStore.addEdgeType(edgeType);
    },
    [graphStore, pushToHistory]
  );

  const updateEdgeType = useCallback(
    (id: string, updates: Partial<Omit<EdgeTypeConfig, 'id'>>) => {
      if (isRestoringRef.current) {
        graphStore.updateEdgeType(id, updates);
        return;
      }
      pushToHistory('Update Edge Type'); // Synchronous push BEFORE mutation
      graphStore.updateEdgeType(id, updates);
    },
    [graphStore, pushToHistory]
  );

  const deleteEdgeType = useCallback(
    (id: string) => {
      if (isRestoringRef.current) {
        graphStore.deleteEdgeType(id);
        return;
      }
      const edgeType = graphStore.edgeTypes.find((et) => et.id === id);
      pushToHistory(`Delete Edge Type: ${edgeType?.label || id}`); // Synchronous push BEFORE mutation
      graphStore.deleteEdgeType(id);
    },
    [graphStore, pushToHistory]
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

  return {
    // Wrapped operations with history
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    addNodeType,
    updateNodeType,
    deleteNodeType,
    addEdgeType,
    updateEdgeType,
    deleteEdgeType,
    clearGraph,

    // Pass through read-only operations
    nodes: graphStore.nodes,
    edges: graphStore.edges,
    nodeTypes: graphStore.nodeTypes,
    edgeTypes: graphStore.edgeTypes,
    setNodes: graphStore.setNodes,
    setEdges: graphStore.setEdges,
    setNodeTypes: graphStore.setNodeTypes,
    setEdgeTypes: graphStore.setEdgeTypes,
    loadGraphState: graphStore.loadGraphState,

    // NOTE: exportToFile and importFromFile have been removed
    // Import/export is now handled by the workspace-level system (useWorkspaceStore)

    // Expose flag for detecting restore operations
    isRestoringRef,
  };
}
