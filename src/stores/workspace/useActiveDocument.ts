import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../workspaceStore';
import { useGraphStore } from '../graphStore';
import { useTimelineStore } from '../timelineStore';
import type { Actor, Relation, NodeTypeConfig, EdgeTypeConfig } from '../../types';
import { getCurrentGraphFromDocument } from '../persistence/loader';

/**
 * useActiveDocument Hook
 *
 * Synchronizes the graphStore with the active document from workspace
 * - Loads active document data into graphStore when document switches
 * - Saves graphStore changes back to workspace
 * - Manages memory by unloading inactive documents after timeout
 */

const UNLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function useActiveDocument() {
  const activeDocumentId = useWorkspaceStore((state) => state.activeDocumentId);
  const activeDocument = useWorkspaceStore((state) => state.getActiveDocument());
  const markDocumentDirty = useWorkspaceStore((state) => state.markDocumentDirty);
  const saveDocument = useWorkspaceStore((state) => state.saveDocument);
  const unloadDocument = useWorkspaceStore((state) => state.unloadDocument);
  const documentOrder = useWorkspaceStore((state) => state.documentOrder);
  const documents = useWorkspaceStore((state) => state.documents);

  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);
  const setNodeTypes = useGraphStore((state) => state.setNodeTypes);
  const setEdgeTypes = useGraphStore((state) => state.setEdgeTypes);
  const graphNodes = useGraphStore((state) => state.nodes);
  const graphEdges = useGraphStore((state) => state.edges);
  const graphNodeTypes = useGraphStore((state) => state.nodeTypes);
  const graphEdgeTypes = useGraphStore((state) => state.edgeTypes);

  // Track unload timers for inactive documents
  const unloadTimersRef = useRef<Map<string, number>>(new Map());

  // Track when we're loading a document to prevent false dirty marking
  const isLoadingRef = useRef(false);
  const lastLoadedDocIdRef = useRef<string | null>(null);

  // Track the last synced graph state per document to prevent stale comparisons
  const lastSyncedStateRef = useRef<{
    documentId: string | null;
    nodes: Actor[];
    edges: Relation[];
    nodeTypes: NodeTypeConfig[];
    edgeTypes: EdgeTypeConfig[];
  }>({
    documentId: null,
    nodes: [],
    edges: [],
    nodeTypes: [],
    edgeTypes: [],
  });

  // Load active document into graphStore when it changes
  useEffect(() => {
    if (activeDocument && activeDocumentId) {
      console.log(`Loading document into graph editor: ${activeDocumentId}`, activeDocument.metadata.title);

      // Get the current graph from the document's timeline
      const currentGraph = getCurrentGraphFromDocument(activeDocument);
      if (!currentGraph) {
        console.error('Failed to get current graph from document');
        return;
      }

      // Set loading flag before updating graph state
      isLoadingRef.current = true;
      lastLoadedDocIdRef.current = activeDocumentId;

      setNodes(currentGraph.nodes as never[]);
      setEdges(currentGraph.edges as never[]);
      setNodeTypes(currentGraph.nodeTypes as never[]);
      setEdgeTypes(currentGraph.edgeTypes as never[]);

      // Update the last synced state to match what we just loaded
      lastSyncedStateRef.current = {
        documentId: activeDocumentId,
        nodes: currentGraph.nodes as Actor[],
        edges: currentGraph.edges as Relation[],
        nodeTypes: currentGraph.nodeTypes as NodeTypeConfig[],
        edgeTypes: currentGraph.edgeTypes as EdgeTypeConfig[],
      };

      // Clear loading flag after a brief delay to allow state to settle
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    } else if (!activeDocumentId) {
      // Clear graph store when no document is active
      console.log('No active document, clearing graph editor');

      // Set loading flag to prevent dirty marking during clear
      isLoadingRef.current = true;
      lastLoadedDocIdRef.current = null;

      setNodes([]);
      setEdges([]);
      // Note: We keep nodeTypes and edgeTypes so they're available for new documents

      // Clear the last synced state
      lastSyncedStateRef.current = {
        documentId: null,
        nodes: [],
        edges: [],
        nodeTypes: [],
        edgeTypes: [],
      };

      // Clear loading flag after a brief delay
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }
  }, [activeDocumentId, activeDocument, documents, setNodes, setEdges, setNodeTypes, setEdgeTypes]);

  // Save graphStore changes back to workspace (debounced via workspace)
  useEffect(() => {
    if (!activeDocumentId || !activeDocument) return;

    // Skip dirty checking if we're currently loading a document
    if (isLoadingRef.current) {
      console.log(`Skipping dirty check - document is loading: ${activeDocumentId}`);
      return;
    }

    // CRITICAL: Prevent cross-document contamination
    // Only process changes if the graph state belongs to the current active document
    if (lastSyncedStateRef.current.documentId !== activeDocumentId) {
      console.log(`Skipping dirty check - graph state is from different document (${lastSyncedStateRef.current.documentId} vs ${activeDocumentId})`);
      return;
    }

    // CRITICAL: Prevent saving stale data to new documents
    // If the last loaded document doesn't match the active document, skip this check
    if (lastLoadedDocIdRef.current !== activeDocumentId) {
      console.log(`Skipping dirty check - document hasn't been loaded yet (last loaded: ${lastLoadedDocIdRef.current}, active: ${activeDocumentId})`);
      return;
    }

    // Mark document as dirty when graph changes
    // NOTE: We only track nodes/edges here. Type changes are handled by workspaceStore's
    // type management actions, which directly mark the document as dirty.
    const hasChanges =
      JSON.stringify(graphNodes) !== JSON.stringify(lastSyncedStateRef.current.nodes) ||
      JSON.stringify(graphEdges) !== JSON.stringify(lastSyncedStateRef.current.edges);

    if (hasChanges) {
      console.log(`Document ${activeDocumentId} has changes, marking as dirty`);
      markDocumentDirty(activeDocumentId);

      // Update the last synced state (keep types for reference, but don't track them for changes)
      lastSyncedStateRef.current = {
        documentId: activeDocumentId,
        nodes: graphNodes as Actor[],
        edges: graphEdges as Relation[],
        nodeTypes: graphNodeTypes as NodeTypeConfig[],
        edgeTypes: graphEdgeTypes as EdgeTypeConfig[],
      };

      // Update the timeline's current state with the new graph data (nodes and edges only)
      useTimelineStore.getState().saveCurrentGraph({
        nodes: graphNodes as never[],
        edges: graphEdges as never[],
      });

      // Debounced save
      const timeoutId = setTimeout(() => {
        saveDocument(activeDocumentId);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [graphNodes, graphEdges, graphNodeTypes, graphEdgeTypes, activeDocumentId, activeDocument, documents, markDocumentDirty, saveDocument]);

  // Memory management: Unload inactive documents after timeout
  useEffect(() => {
    if (!activeDocumentId) return;

    const timers = unloadTimersRef.current;

    // Clear timer for active document (it should stay loaded)
    const activeTimer = timers.get(activeDocumentId);
    if (activeTimer) {
      clearTimeout(activeTimer);
      timers.delete(activeDocumentId);
    }

    // Set timers for all other loaded documents
    documentOrder.forEach((docId) => {
      if (docId === activeDocumentId) return; // Skip active
      if (!documents.has(docId)) return; // Skip already unloaded

      // Clear existing timer for this doc
      const existingTimer = timers.get(docId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer to unload after timeout
      const timer = setTimeout(() => {
        console.log(`Unloading inactive document: ${docId}`);
        unloadDocument(docId);
        timers.delete(docId);
      }, UNLOAD_TIMEOUT);

      timers.set(docId, timer);
    });

    // Cleanup all timers on unmount
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [activeDocumentId, documentOrder, documents, unloadDocument]);

  return {
    activeDocumentId,
    activeDocument,
  };
}
