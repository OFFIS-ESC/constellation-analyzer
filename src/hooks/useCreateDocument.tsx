import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import InputDialog from '../components/Common/InputDialog';

/**
 * useCreateDocument Hook
 *
 * Provides a consistent document creation flow with naming dialog
 * across the application. Returns both the handler function and
 * the dialog component to render.
 *
 * Usage:
 * ```tsx
 * const { handleNewDocument, NewDocumentDialog } = useCreateDocument();
 *
 * return (
 *   <>
 *     <button onClick={handleNewDocument}>New Document</button>
 *     {NewDocumentDialog}
 *   </>
 * );
 * ```
 */
export function useCreateDocument() {
  const [showDialog, setShowDialog] = useState(false);
  const { createDocument } = useWorkspaceStore();

  const handleNewDocument = useCallback(() => {
    setShowDialog(true);
  }, []);

  const handleConfirm = useCallback(
    (title: string) => {
      createDocument(title);
      setShowDialog(false);
    },
    [createDocument]
  );

  const handleCancel = useCallback(() => {
    setShowDialog(false);
  }, []);

  const NewDocumentDialog = (
    <InputDialog
      isOpen={showDialog}
      title="New Document"
      message="Enter a name for the new document:"
      placeholder="e.g., Team Analysis, Project Relationships..."
      defaultValue="Untitled Analysis"
      confirmLabel="Create"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      validateInput={(value) => {
        if (!value.trim()) return 'Document name cannot be empty';
        return null;
      }}
    />
  );

  return {
    handleNewDocument,
    NewDocumentDialog,
  };
}
