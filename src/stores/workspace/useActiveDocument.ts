import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../workspaceStore';
import { useGraphStore } from '../graphStore';

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

  // Load active document into graphStore when it changes
  useEffect(() => {
    if (activeDocument && activeDocumentId) {
      console.log(`Loading document into graph editor: ${activeDocumentId}`, activeDocument.metadata.title);

      // Set loading flag before updating graph state
      isLoadingRef.current = true;
      lastLoadedDocIdRef.current = activeDocumentId;

      setNodes(activeDocument.graph.nodes as never[]);
      setEdges(activeDocument.graph.edges as never[]);
      setNodeTypes(activeDocument.graph.nodeTypes as never[]);
      setEdgeTypes(activeDocument.graph.edgeTypes as never[]);

      // Clear loading flag after a brief delay to allow state to settle
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

    // Mark document as dirty when graph changes
    const hasChanges =
      JSON.stringify(graphNodes) !== JSON.stringify(activeDocument.graph.nodes) ||
      JSON.stringify(graphEdges) !== JSON.stringify(activeDocument.graph.edges) ||
      JSON.stringify(graphNodeTypes) !== JSON.stringify(activeDocument.graph.nodeTypes) ||
      JSON.stringify(graphEdgeTypes) !== JSON.stringify(activeDocument.graph.edgeTypes);

    if (hasChanges) {
      console.log(`Document ${activeDocumentId} has changes, marking as dirty`);
      markDocumentDirty(activeDocumentId);

      // Update the document in workspace
      activeDocument.graph.nodes = graphNodes as never[];
      activeDocument.graph.edges = graphEdges as never[];
      activeDocument.graph.nodeTypes = graphNodeTypes as never[];
      activeDocument.graph.edgeTypes = graphEdgeTypes as never[];

      // Debounced save
      const timeoutId = setTimeout(() => {
        saveDocument(activeDocumentId);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [graphNodes, graphEdges, graphNodeTypes, graphEdgeTypes, activeDocumentId, activeDocument, markDocumentDirty, saveDocument]);

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
