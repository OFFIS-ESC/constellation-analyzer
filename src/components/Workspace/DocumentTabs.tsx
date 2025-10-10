import { useCallback, useState } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import Tab from './Tab';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ContextMenu from '../Editor/ContextMenu';

/**
 * DocumentTabs Component
 *
 * Tab bar for managing multiple documents:
 * - Displays all open documents as tabs
 * - Highlights active document
 * - Shows dirty state indicators
 * - New tab button
 * - Tab switching, closing, renaming
 * - Drag-to-reorder tabs
 */

const DocumentTabs = () => {
  const {
    documentOrder,
    activeDocumentId,
    documentMetadata,
    switchToDocument,
    closeDocument,
    renameDocument,
    createDocument,
    reorderDocuments,
    duplicateDocument,
    exportDocument,
    deleteDocument,
  } = useWorkspaceStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    documentId: string;
  } | null>(null);
  const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);

  const handleTabClick = useCallback(
    (documentId: string) => {
      if (documentId !== activeDocumentId) {
        switchToDocument(documentId);
      }
    },
    [activeDocumentId, switchToDocument]
  );

  const handleTabClose = useCallback(
    (documentId: string) => {
      closeDocument(documentId);
    },
    [closeDocument]
  );

  const handleTabRename = useCallback(
    (documentId: string, newTitle: string) => {
      renameDocument(documentId, newTitle);
    },
    [renameDocument]
  );

  const handleNewDocument = useCallback(() => {
    createDocument();
  }, [createDocument]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...documentOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    reorderDocuments(newOrder);
    setDraggedIndex(index);
  }, [draggedIndex, documentOrder, reorderDocuments]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleTabContextMenu = useCallback((e: React.MouseEvent, documentId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      documentId,
    });
  }, []);

  const handleRenameFromMenu = useCallback(() => {
    if (!contextMenu) return;
    setRenameDocumentId(contextMenu.documentId);
    setContextMenu(null);
  }, [contextMenu]);

  const handleDuplicateFromMenu = useCallback(() => {
    if (!contextMenu) return;
    const newDocId = duplicateDocument(contextMenu.documentId);
    switchToDocument(newDocId);
    setContextMenu(null);
  }, [contextMenu, duplicateDocument, switchToDocument]);

  const handleExportFromMenu = useCallback(() => {
    if (!contextMenu) return;
    exportDocument(contextMenu.documentId);
    setContextMenu(null);
  }, [contextMenu, exportDocument]);

  const handleCloseFromMenu = useCallback(() => {
    if (!contextMenu) return;
    closeDocument(contextMenu.documentId);
    setContextMenu(null);
  }, [contextMenu, closeDocument]);

  const handleDeleteFromMenu = useCallback(() => {
    if (!contextMenu) return;
    deleteDocument(contextMenu.documentId);
    setContextMenu(null);
  }, [contextMenu, deleteDocument]);

  return (
    <div className="flex items-center bg-gray-100 border-b border-gray-300 overflow-x-auto">
      {/* Document tabs */}
      <div className="flex flex-1 overflow-x-auto">
        {documentOrder.map((docId, index) => {
          const metadata = documentMetadata.get(docId);
          if (!metadata) return null;

          return (
            <div
              key={docId}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={draggedIndex === index ? 'opacity-50' : ''}
            >
              <Tab
                id={docId}
                title={metadata.title}
                isActive={docId === activeDocumentId}
                isDirty={metadata.isDirty}
                color={metadata.color}
                onClick={() => handleTabClick(docId)}
                onClose={() => handleTabClose(docId)}
                onRename={(newTitle) => handleTabRename(docId, newTitle)}
                onContextMenu={(e) => handleTabContextMenu(e, docId)}
                triggerRename={renameDocumentId === docId}
                onRenameDone={() => setRenameDocumentId(null)}
              />
            </div>
          );
        })}
      </div>

      {/* New tab button */}
      <button
        onClick={handleNewDocument}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 transition-colors border-l border-gray-300"
        title="New document"
      >
        <AddIcon sx={{ fontSize: 18 }} />
        <span className="hidden sm:inline">New</span>
      </button>

      {/* Tab Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          sections={[
            {
              actions: [
                {
                  label: 'Rename',
                  icon: <EditIcon fontSize="small" />,
                  onClick: handleRenameFromMenu,
                },
                {
                  label: 'Duplicate',
                  icon: <FileCopyIcon fontSize="small" />,
                  onClick: handleDuplicateFromMenu,
                },
                {
                  label: 'Export',
                  icon: <FileDownloadIcon fontSize="small" />,
                  onClick: handleExportFromMenu,
                },
              ],
            },
            {
              actions: [
                {
                  label: 'Close',
                  icon: <CloseIcon fontSize="small" />,
                  onClick: handleCloseFromMenu,
                },
                {
                  label: 'Delete',
                  icon: <DeleteIcon fontSize="small" />,
                  onClick: handleDeleteFromMenu,
                },
              ],
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default DocumentTabs;
