import { useState, useCallback, useRef, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import DocumentManager from '../Workspace/DocumentManager';
import NodeTypeConfigModal from '../Config/NodeTypeConfig';
import EdgeTypeConfigModal from '../Config/EdgeTypeConfig';
import { useConfirm } from '../../hooks/useConfirm';

/**
 * MenuBar Component
 *
 * Top-level menu bar with dropdown menus for:
 * - File: Document and workspace operations
 * - Edit: Configuration and settings
 * - View: Display and navigation options
 * - Help: Documentation and keyboard shortcuts
 */

interface MenuBarProps {
  onOpenHelp?: () => void;
  onFitView?: () => void;
  onSelectAll?: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ onOpenHelp, onFitView, onSelectAll }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [showEdgeConfig, setShowEdgeConfig] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const {
    createDocument,
    createDocumentFromTemplate,
    activeDocumentId,
    exportDocument,
    importDocumentFromFile,
    switchToDocument,
    exportAllDocumentsAsZip,
    exportWorkspace,
    importWorkspace,
  } = useWorkspaceStore();

  const { clearGraph } = useGraphWithHistory();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeMenu]);

  const toggleMenu = useCallback((menuName: string) => {
    setActiveMenu((current) => (current === menuName ? null : menuName));
  }, []);

  const closeMenu = useCallback(() => {
    setActiveMenu(null);
  }, []);

  const handleNewDocument = useCallback(() => {
    createDocument();
    closeMenu();
  }, [createDocument, closeMenu]);

  const handleNewDocumentFromTemplate = useCallback(() => {
    if (!activeDocumentId) {
      alert('Please open a document first to use it as a template');
      closeMenu();
      return;
    }
    const newDocId = createDocumentFromTemplate(activeDocumentId);
    if (newDocId) {
      switchToDocument(newDocId);
    }
    closeMenu();
  }, [createDocumentFromTemplate, activeDocumentId, switchToDocument, closeMenu]);

  const handleOpenDocumentManager = useCallback(() => {
    setShowDocumentManager(true);
    closeMenu();
  }, [closeMenu]);

  const handleImport = useCallback(async () => {
    const newDocId = await importDocumentFromFile();
    if (newDocId) {
      switchToDocument(newDocId);
    }
    closeMenu();
  }, [importDocumentFromFile, switchToDocument, closeMenu]);

  const handleExport = useCallback(() => {
    if (activeDocumentId) {
      exportDocument(activeDocumentId);
    }
    closeMenu();
  }, [activeDocumentId, exportDocument, closeMenu]);

  const handleExportAll = useCallback(() => {
    exportAllDocumentsAsZip();
    closeMenu();
  }, [exportAllDocumentsAsZip, closeMenu]);

  const handleExportWorkspace = useCallback(() => {
    exportWorkspace();
    closeMenu();
  }, [exportWorkspace, closeMenu]);

  const handleImportWorkspace = useCallback(() => {
    importWorkspace();
    closeMenu();
  }, [importWorkspace, closeMenu]);

  const handleConfigureActors = useCallback(() => {
    setShowNodeConfig(true);
    closeMenu();
  }, [closeMenu]);

  const handleConfigureRelations = useCallback(() => {
    setShowEdgeConfig(true);
    closeMenu();
  }, [closeMenu]);

  const handleClearGraph = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Clear Current Graph',
      message: 'Are you sure you want to clear the current graph? This will remove all actors and relations from this document.',
      confirmLabel: 'Clear Graph',
      severity: 'danger',
    });
    if (confirmed) {
      clearGraph();
    }
    closeMenu();
  }, [clearGraph, closeMenu, confirm]);

  return (
    <>
      <div ref={menuRef} className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center px-4 py-1">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('file')}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                activeMenu === 'file'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              File
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            </button>

            {activeMenu === 'file' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={handleNewDocument}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>New Document</span>
                  <span className="text-xs text-gray-400">Ctrl+N</span>
                </button>
                <button
                  onClick={handleNewDocumentFromTemplate}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={!activeDocumentId}
                >
                  New from Current Template
                </button>
                <button
                  onClick={handleOpenDocumentManager}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>Document Manager</span>
                  <span className="text-xs text-gray-400">Ctrl+O</span>
                </button>

                <hr className="my-1 border-gray-200" />

                <button
                  onClick={handleImport}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Import Document
                </button>
                <button
                  onClick={handleExport}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>Export Document</span>
                  <span className="text-xs text-gray-400">Ctrl+S</span>
                </button>
                <button
                  onClick={handleExportAll}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export All as ZIP
                </button>

                <hr className="my-1 border-gray-200" />

                <button
                  onClick={handleExportWorkspace}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export Workspace
                </button>
                <button
                  onClick={handleImportWorkspace}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Import Workspace
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('edit')}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                activeMenu === 'edit'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Edit
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            </button>

            {activeMenu === 'edit' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={handleConfigureActors}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Configure Actor Types
                </button>
                <button
                  onClick={handleConfigureRelations}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Configure Relation Types
                </button>

                <hr className="my-1 border-gray-200" />

                <button
                  onClick={handleClearGraph}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Clear Current Graph
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('view')}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                activeMenu === 'view'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              View
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            </button>

            {activeMenu === 'view' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    onFitView?.();
                    closeMenu();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>Fit View to Content</span>
                  <span className="text-xs text-gray-400">F</span>
                </button>
                <button
                  onClick={() => {
                    onSelectAll?.();
                    closeMenu();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>Select All</span>
                  <span className="text-xs text-gray-400">Ctrl+A</span>
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('help')}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                activeMenu === 'help'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Help
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            </button>

            {activeMenu === 'help' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    onOpenHelp?.();
                    closeMenu();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>Keyboard Shortcuts</span>
                  <span className="text-xs text-gray-400">?</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentManager
        isOpen={showDocumentManager}
        onClose={() => setShowDocumentManager(false)}
      />
      <NodeTypeConfigModal
        isOpen={showNodeConfig}
        onClose={() => setShowNodeConfig(false)}
      />
      <EdgeTypeConfigModal
        isOpen={showEdgeConfig}
        onClose={() => setShowEdgeConfig(false)}
      />

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </>
  );
};

export default MenuBar;
