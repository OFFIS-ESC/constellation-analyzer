import { useCallback, useState, useMemo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import SearchIcon from '@mui/icons-material/Search';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useConfirm } from '../../hooks/useConfirm';
import DocumentCard from './DocumentCard';

/**
 * DocumentManager Component
 *
 * Modal/panel showing all documents in the workspace
 * Features:
 * - Grid view of all documents
 * - Create new document
 * - Import document from file
 * - Duplicate/export/delete documents
 */

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentManager = ({ isOpen, onClose }: DocumentManagerProps) => {
  const {
    documentMetadata,
    documentOrder,
    createDocument,
    switchToDocument,
    duplicateDocument,
    exportDocument,
    deleteDocument,
    importDocumentFromFile,
    exportAllDocumentsAsZip,
    exportWorkspace,
    importWorkspace,
  } = useWorkspaceStore();

  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');

  // Get all document IDs from metadata (includes both open and closed documents)
  const allDocumentIds = useMemo(() => {
    return Array.from(documentMetadata.keys());
  }, [documentMetadata]);

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    const docsToFilter = searchQuery.trim() ? allDocumentIds : allDocumentIds;

    if (!searchQuery.trim()) {
      return allDocumentIds;
    }

    const query = searchQuery.toLowerCase();
    return docsToFilter.filter((docId) => {
      const meta = documentMetadata.get(docId);
      if (!meta) return false;

      return (
        meta.title.toLowerCase().includes(query) ||
        meta.fileName?.toLowerCase().includes(query)
      );
    });
  }, [allDocumentIds, documentMetadata, searchQuery]);

  const handleNewDocument = useCallback(() => {
    const newDocId = createDocument();
    switchToDocument(newDocId);
    onClose();
  }, [createDocument, switchToDocument, onClose]);

  const handleImportDocument = useCallback(async () => {
    const newDocId = await importDocumentFromFile();
    if (newDocId) {
      switchToDocument(newDocId);
      onClose();
    }
  }, [importDocumentFromFile, switchToDocument, onClose]);

  const handleOpenDocument = useCallback(
    (documentId: string) => {
      switchToDocument(documentId);
      onClose();
    },
    [switchToDocument, onClose]
  );

  const handleDuplicateDocument = useCallback(
    (documentId: string) => {
      const newDocId = duplicateDocument(documentId);
      switchToDocument(newDocId);
      onClose();
    },
    [duplicateDocument, switchToDocument, onClose]
  );

  const handleExportDocument = useCallback(
    (documentId: string) => {
      exportDocument(documentId);
    },
    [exportDocument]
  );

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      const meta = documentMetadata.get(documentId);
      if (!meta) return;

      const confirmTitle = 'Delete Document';
      const confirmMessage = meta.isDirty
        ? `"${meta.title}" has unsaved changes. Delete anyway?`
        : `Are you sure you want to delete "${meta.title}"?`;

      const confirmed = await confirm({
        title: confirmTitle,
        message: confirmMessage,
        confirmLabel: 'Delete',
        severity: 'danger',
      });

      if (confirmed) {
        deleteDocument(documentId);
      }
    },
    [documentMetadata, deleteDocument, confirm]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 bg-white rounded-lg shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Document Manager</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <CloseIcon className="text-gray-500" />
          </button>
        </div>

        {/* Actions bar */}
        <div className="flex flex-col gap-3 px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleNewDocument}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <AddIcon sx={{ fontSize: 20 }} />
              New Document
            </button>
            <button
              onClick={handleImportDocument}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <FileUploadIcon sx={{ fontSize: 20 }} />
              Import Document
            </button>

            <div className="flex-1" />

            <button
              onClick={exportAllDocumentsAsZip}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              title="Export all documents as ZIP"
            >
              <FolderZipIcon sx={{ fontSize: 20 }} />
              Export All
            </button>
            <button
              onClick={exportWorkspace}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              title="Export workspace with all documents and settings"
            >
              <FileDownloadIcon sx={{ fontSize: 20 }} />
              Export Workspace
            </button>
            <button
              onClick={importWorkspace}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              title="Import workspace from ZIP"
            >
              <FileUploadIcon sx={{ fontSize: 20 }} />
              Import Workspace
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" sx={{ fontSize: 20 }} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Document grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {allDocumentIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg mb-4">No documents yet</p>
              <button
                onClick={handleNewDocument}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create your first document
              </button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <SearchIcon sx={{ fontSize: 48 }} className="mb-4" />
              <p className="text-lg">No documents match "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((docId) => {
                const meta = documentMetadata.get(docId);
                if (!meta) return null;

                const isOpen = documentOrder.includes(docId);

                return (
                  <DocumentCard
                    key={docId}
                    metadata={meta}
                    isOpen={isOpen}
                    onClick={() => handleOpenDocument(docId)}
                    onDuplicate={() => handleDuplicateDocument(docId)}
                    onExport={() => handleExportDocument(docId)}
                    onDelete={() => handleDeleteDocument(docId)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
          {searchQuery ? (
            <>
              Showing {filteredDocuments.length} of {allDocumentIds.length} document{allDocumentIds.length !== 1 ? 's' : ''}
            </>
          ) : (
            <>
              {allDocumentIds.length} document{allDocumentIds.length !== 1 ? 's' : ''} in workspace
              {documentOrder.length > 0 && documentOrder.length < allDocumentIds.length && (
                <> • {documentOrder.length} open</>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </>
  );
};

export default DocumentManager;
