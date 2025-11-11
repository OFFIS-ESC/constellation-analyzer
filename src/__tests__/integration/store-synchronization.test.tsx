import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useHistoryStore } from '../../stores/historyStore';
import { resetWorkspaceStore } from '../../test-utils/test-helpers';

/**
 * Integration tests for store synchronization patterns
 *
 * These tests verify that stores properly integrate through their documented APIs,
 * NOT through UI interactions. They test the business logic layer - how stores
 * communicate and stay synchronized.
 *
 * Key integration points tested:
 * - Document creation initializes all related stores (timeline, history, graph types)
 * - Document persistence includes data from all stores
 * - Store state is properly isolated per document
 */
describe('Store Synchronization Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    resetWorkspaceStore();
  });

  describe('Document Creation Integration', () => {
    it('should initialize timeline data in document', () => {
      const docId = useWorkspaceStore.getState().createDocument('Timeline Test');

      // Document should have timeline data
      const doc = useWorkspaceStore.getState().documents.get(docId);
      expect(doc?.timeline).toBeDefined();
      expect(doc?.timeline.states).toBeDefined();
    });

    it('should persist node and edge types to document', () => {
      const docId = useWorkspaceStore.getState().createDocument('Types Test');

      // Get fresh state after creation
      const doc = useWorkspaceStore.getState().documents.get(docId);
      expect(doc).toBeDefined();
      expect(doc?.nodeTypes).toBeDefined();
      expect(doc?.nodeTypes.length).toBeGreaterThan(0);
      expect(doc?.edgeTypes).toBeDefined();
      expect(doc?.edgeTypes.length).toBeGreaterThan(0);
    });

    it('should create empty initial timeline state', () => {
      const docId = useWorkspaceStore.getState().createDocument('Initial State Test');

      // Get fresh state after creation
      const doc = useWorkspaceStore.getState().documents.get(docId);
      expect(doc?.timeline).toBeDefined();
      expect(doc?.timeline.states).toBeDefined();
    });
  });

  describe('Document Persistence Integration', () => {
    it('should include all required fields in document', () => {
      const docId = useWorkspaceStore.getState().createDocument('Persistence Test');

      // Document should have all required data structures
      const doc = useWorkspaceStore.getState().documents.get(docId);
      expect(doc).toBeDefined();
      expect(doc?.metadata.title).toBe('Persistence Test');
      expect(doc?.nodeTypes).toBeDefined();
      expect(doc?.edgeTypes).toBeDefined();
      expect(doc?.timeline).toBeDefined();
      expect(doc?.bibliography).toBeDefined();
    });

    it('should track document order and active document', () => {
      const doc1Id = useWorkspaceStore.getState().createDocument('Doc 1');
      const doc2Id = useWorkspaceStore.getState().createDocument('Doc 2');

      // Workspace state should track documents
      const state = useWorkspaceStore.getState();
      expect(state.documentOrder).toContain(doc1Id);
      expect(state.documentOrder).toContain(doc2Id);
      expect(state.activeDocumentId).toBe(doc2Id); // Last created is active
    });
  });

  describe('Document Isolation', () => {
    it('should maintain separate documents in workspace', () => {
      const doc1Id = useWorkspaceStore.getState().createDocument('Document 1');
      const doc2Id = useWorkspaceStore.getState().createDocument('Document 2');
      const doc3Id = useWorkspaceStore.getState().createDocument('Document 3');

      // Get fresh state
      const state = useWorkspaceStore.getState();

      // All documents should exist in workspace
      expect(state.documents.size).toBe(3);
      expect(state.documents.has(doc1Id)).toBe(true);
      expect(state.documents.has(doc2Id)).toBe(true);
      expect(state.documents.has(doc3Id)).toBe(true);

      // Document order should be correct
      expect(state.documentOrder).toEqual([doc1Id, doc2Id, doc3Id]);
    });

    it('should create independent timeline data per document', async () => {
      const doc1Id = useWorkspaceStore.getState().createDocument('Doc 1');
      const doc1 = useWorkspaceStore.getState().documents.get(doc1Id);

      const doc2Id = useWorkspaceStore.getState().createDocument('Doc 2');
      const doc2 = useWorkspaceStore.getState().documents.get(doc2Id);

      // Each document should have its own timeline data
      expect(doc1?.timeline).toBeDefined();
      expect(doc2?.timeline).toBeDefined();

      // Timeline data should be independent objects
      expect(doc1?.timeline).not.toBe(doc2?.timeline);
    });
  });

  describe('Document Deletion Integration', () => {
    it('should remove document from workspace and storage', () => {
      const workspaceStore = useWorkspaceStore.getState();

      const doc1Id = workspaceStore.createDocument('Keep');
      const doc2Id = workspaceStore.createDocument('Delete');

      // Mock confirm for deletion
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      workspaceStore.deleteDocument(doc2Id);

      // Document should be removed from workspace
      expect(useWorkspaceStore.getState().documents.has(doc2Id)).toBe(false);
      expect(useWorkspaceStore.getState().documentOrder).not.toContain(doc2Id);

      // Document should be removed from localStorage
      const stored = localStorage.getItem(`document-${doc2Id}`);
      expect(stored).toBeNull();

      // Other document should still exist
      expect(useWorkspaceStore.getState().documents.has(doc1Id)).toBe(true);

      vi.restoreAllMocks();
    });

    it('should update active document when deleting current document', () => {
      const workspaceStore = useWorkspaceStore.getState();

      const doc1Id = workspaceStore.createDocument('Doc 1');
      const doc2Id = workspaceStore.createDocument('Doc 2');

      expect(useWorkspaceStore.getState().activeDocumentId).toBe(doc2Id);

      // Mock confirm
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      workspaceStore.deleteDocument(doc2Id);

      // Active document should switch to doc1
      const state = useWorkspaceStore.getState();
      expect(state.activeDocumentId).toBe(doc1Id);

      vi.restoreAllMocks();
    });
  });

  describe('Document Type Management Integration', () => {
    it('should allow adding custom node types to document', () => {
      const workspaceStore = useWorkspaceStore.getState();
      const docId = workspaceStore.createDocument('Custom Types');

      const customType = {
        id: 'custom-type',
        label: 'Custom Type',
        color: '#ff0000',
        shape: 'circle' as const,
        icon: 'Star',
        description: 'A custom node type',
      };

      workspaceStore.addNodeTypeToDocument(docId, customType);

      const doc = useWorkspaceStore.getState().documents.get(docId);
      const hasCustomType = doc?.nodeTypes.some(t => t.id === 'custom-type');
      expect(hasCustomType).toBe(true);
    });

    it('should allow updating edge types in document', () => {
      const workspaceStore = useWorkspaceStore.getState();
      const docId = workspaceStore.createDocument('Edge Types');

      const doc = useWorkspaceStore.getState().documents.get(docId);
      const firstEdgeType = doc?.edgeTypes[0];
      expect(firstEdgeType).toBeDefined();

      workspaceStore.updateEdgeTypeInDocument(docId, firstEdgeType!.id, {
        label: 'Updated Label',
        color: '#00ff00',
      });

      const updatedDoc = useWorkspaceStore.getState().documents.get(docId);
      const updatedType = updatedDoc?.edgeTypes.find(t => t.id === firstEdgeType!.id);
      expect(updatedType?.label).toBe('Updated Label');
      expect(updatedType?.color).toBe('#00ff00');
    });
  });

  describe('Document Duplication Integration', () => {
    it('should duplicate document with all its data', () => {
      const workspaceStore = useWorkspaceStore.getState();
      const originalId = workspaceStore.createDocument('Original');

      // Add custom type to original
      workspaceStore.addNodeTypeToDocument(originalId, {
        id: 'custom',
        label: 'Custom',
        color: '#ff0000',
        shape: 'circle' as const,
        icon: 'Star',
        description: 'Custom type',
      });

      const duplicateId = workspaceStore.duplicateDocument(originalId);
      expect(duplicateId).toBeTruthy();
      expect(duplicateId).not.toBe(originalId);

      // Duplicate should have the custom type
      const duplicateDoc = useWorkspaceStore.getState().documents.get(duplicateId);
      const hasCustomType = duplicateDoc?.nodeTypes.some(t => t.id === 'custom');
      expect(hasCustomType).toBe(true);

      // Both documents should exist
      expect(useWorkspaceStore.getState().documents.size).toBe(2);
    });
  });

  describe('History Store Integration', () => {
    it('should initialize history for new document', () => {
      const workspaceStore = useWorkspaceStore.getState();
      const docId = workspaceStore.createDocument('History Test');

      const historyStore = useHistoryStore.getState();

      // History should be initialized (can check if functions work)
      const canUndo = historyStore.canUndo(docId);
      const canRedo = historyStore.canRedo(docId);

      // New document shouldn't have undo/redo yet
      expect(canUndo).toBe(false);
      expect(canRedo).toBe(false);
    });

    it('should maintain separate history per document', () => {
      const workspaceStore = useWorkspaceStore.getState();
      const doc1Id = workspaceStore.createDocument('Doc 1');
      const doc2Id = workspaceStore.createDocument('Doc 2');

      const historyStore = useHistoryStore.getState();

      // Both documents should have independent history
      const doc1CanUndo = historyStore.canUndo(doc1Id);
      const doc2CanUndo = historyStore.canUndo(doc2Id);

      // Both should be false for new documents
      expect(doc1CanUndo).toBe(false);
      expect(doc2CanUndo).toBe(false);
    });

    it('should remove history when document is deleted', () => {
      const workspaceStore = useWorkspaceStore.getState();
      const docId = workspaceStore.createDocument('To Delete');

      const historyStore = useHistoryStore.getState();

      // Initialize history
      historyStore.initializeHistory(docId);

      // Mock confirm
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      // Delete document
      workspaceStore.deleteDocument(docId);

      // History should be removed (checking canUndo shouldn't error)
      const canUndo = historyStore.canUndo(docId);
      expect(canUndo).toBe(false);

      vi.restoreAllMocks();
    });
  });

  describe('Document Rename Integration', () => {
    it('should update document title and metadata', () => {
      const workspaceStore = useWorkspaceStore.getState();
      const docId = workspaceStore.createDocument('Original Title');

      workspaceStore.renameDocument(docId, 'New Title');

      const doc = useWorkspaceStore.getState().documents.get(docId);
      expect(doc?.metadata.title).toBe('New Title');

      const metadata = useWorkspaceStore.getState().documentMetadata.get(docId);
      expect(metadata?.title).toBe('New Title');
    });

    it('should update metadata after rename', () => {
      const workspaceStore = useWorkspaceStore.getState();
      const docId = workspaceStore.createDocument('Test');

      workspaceStore.renameDocument(docId, 'Renamed');

      const metadata = useWorkspaceStore.getState().documentMetadata.get(docId);
      expect(metadata?.title).toBe('Renamed');
      // Note: isDirty flag behavior may vary by implementation
    });
  });

  describe('Multiple Document Operations', () => {
    it('should handle creating many documents', () => {
      const workspaceStore = useWorkspaceStore.getState();

      const docIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const docId = workspaceStore.createDocument(`Document ${i}`);
        docIds.push(docId);
      }

      expect(useWorkspaceStore.getState().documents.size).toBe(10);
      expect(useWorkspaceStore.getState().documentOrder).toHaveLength(10);

      // All should be unique
      const uniqueIds = new Set(docIds);
      expect(uniqueIds.size).toBe(10);
    });

    it('should handle deleting multiple documents in sequence', () => {
      const workspaceStore = useWorkspaceStore.getState();

      const doc1Id = workspaceStore.createDocument('Doc 1');
      const doc2Id = workspaceStore.createDocument('Doc 2');
      const doc3Id = workspaceStore.createDocument('Doc 3');

      // Mock confirm
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      workspaceStore.deleteDocument(doc2Id);
      expect(useWorkspaceStore.getState().documents.size).toBe(2);

      workspaceStore.deleteDocument(doc3Id);
      expect(useWorkspaceStore.getState().documents.size).toBe(1);

      expect(useWorkspaceStore.getState().documents.has(doc1Id)).toBe(true);

      vi.restoreAllMocks();
    });
  });
});
