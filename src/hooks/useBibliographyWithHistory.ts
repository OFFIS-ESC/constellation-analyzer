import { useGraphStore } from '../stores/graphStore';
import { useBibliographyStore } from '../stores/bibliographyStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useGraphWithHistory } from './useGraphWithHistory';
import { useDocumentHistory } from './useDocumentHistory';
import type { CSLReference } from '../types/bibliography';

/**
 * Hook that wraps bibliography operations with history tracking
 * Similar to useGraphWithHistory pattern
 */
export const useBibliographyWithHistory = () => {
  const { addReference, updateReference, deleteReference } = useBibliographyStore();
  const { pushToHistory } = useDocumentHistory();
  const { activeDocumentId } = useWorkspaceStore();
  const { nodes, edges } = useGraphStore();
  const { updateNode, updateEdge } = useGraphWithHistory();

  const addReferenceWithHistory = (ref: Partial<CSLReference>) => {
    const id = addReference(ref);
    pushToHistory(`Added reference: ${ref.title || 'Untitled'}`);

    // Mark document as dirty
    useWorkspaceStore.getState().markDocumentDirty(activeDocumentId!);

    return id;
  };

  const updateReferenceWithHistory = (id: string, updates: Partial<CSLReference>) => {
    const ref = useBibliographyStore.getState().getReferenceById(id);
    updateReference(id, updates);
    pushToHistory(`Updated reference: ${ref?.title || 'Unknown'}`);

    // Mark document as dirty
    useWorkspaceStore.getState().markDocumentDirty(activeDocumentId!);
  };

  const deleteReferenceWithHistory = (id: string) => {
    const ref = useBibliographyStore.getState().getReferenceById(id);

    // Remove citations from nodes and edges
    nodes.forEach(node => {
      if (node.data.citations?.includes(id)) {
        updateNode(node.id, {
          data: {
            ...node.data,
            citations: node.data.citations.filter(cid => cid !== id),
          },
        });
      }
    });

    edges.forEach(edge => {
      if (edge.data?.citations?.includes(id)) {
        updateEdge(edge.id, {
          ...edge.data,
          citations: edge.data.citations.filter(cid => cid !== id),
        });
      }
    });

    deleteReference(id);
    pushToHistory(`Deleted reference: ${ref?.title || 'Unknown'}`);

    // Mark document as dirty
    useWorkspaceStore.getState().markDocumentDirty(activeDocumentId!);
  };

  const getCitationCount = (referenceId: string) => {
    const nodeCount = nodes.filter(n => n.data.citations?.includes(referenceId)).length;
    const edgeCount = edges.filter(e => e.data?.citations?.includes(referenceId)).length;
    return { nodes: nodeCount, edges: edgeCount };
  };

  return {
    addReference: addReferenceWithHistory,
    updateReference: updateReferenceWithHistory,
    deleteReference: deleteReferenceWithHistory,
    getCitationCount,
  };
};
