import { useState, useCallback, useRef, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useDocumentHistory } from '../../hooks/useDocumentHistory';
import DocumentManager from '../Workspace/DocumentManager';
import NodeTypeConfigModal from '../Config/NodeTypeConfig';
import EdgeTypeConfigModal from '../Config/EdgeTypeConfig';
import LabelConfigModal from '../Config/LabelConfig';
import TangibleConfigModal from '../Config/TangibleConfig';
import TuioConnectionConfig from '../Config/TuioConnectionConfig';
import BibliographyConfigModal from '../Config/BibliographyConfig';
import InputDialog from '../Common/InputDialog';
import ConceptIndex from '../Help/ConceptIndex';
import { useConfirm } from '../../hooks/useConfirm';
import { useShortcutLabels } from '../../hooks/useShortcutLabels';
import type { ExportOptions } from '../../utils/graphExport';

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
  onExport?: (format: 'png' | 'svg', options?: ExportOptions) => Promise<void>;
}

const MenuBar: React.FC<MenuBarProps> = ({ onOpenHelp, onFitView, onExport }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [showEdgeConfig, setShowEdgeConfig] = useState(false);
  const [showLabelConfig, setShowLabelConfig] = useState(false);
  const [showTangibleConfig, setShowTangibleConfig] = useState(false);
  const [showTuioConfig, setShowTuioConfig] = useState(false);
  const [showBibliographyConfig, setShowBibliographyConfig] = useState(false);
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [showNewFromTemplateDialog, setShowNewFromTemplateDialog] = useState(false);
  const [showConceptIndex, setShowConceptIndex] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const { getShortcutLabel } = useShortcutLabels();

  const {
    createDocument,
    createDocumentFromTemplate,
    createExampleDocument,
    activeDocumentId,
    documentOrder,
    exportDocument,
    importDocumentFromFile,
    switchToDocument,
    exportAllDocumentsAsZip,
    exportWorkspace,
    importWorkspace,
  } = useWorkspaceStore();

  const { clearGraph } = useGraphWithHistory();
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription } = useDocumentHistory();
  const { setPresentationMode } = useSettingsStore();

  // Listen for custom event to close all menus (e.g., from graph canvas clicks, context menu opens)
  useEffect(() => {
    const handleCloseMenuEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Don't close if the event came from MenuBar itself (source: 'menubar')
      if (customEvent.detail?.source !== 'menubar') {
        setActiveMenu(null);
      }
    };

    window.addEventListener('closeAllMenus', handleCloseMenuEvent);
    return () => window.removeEventListener('closeAllMenus', handleCloseMenuEvent);
  }, []);

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
    setActiveMenu((current) => {
      const newMenu = current === menuName ? null : menuName;
      // When opening a menu (not closing), dispatch event to close context menus after state updates
      if (newMenu !== null && current !== menuName) {
        // Use setTimeout to dispatch after the render phase completes
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('closeAllMenus', { detail: { source: 'menubar' } }));
        }, 0);
      }
      return newMenu;
    });
  }, []);

  const closeMenu = useCallback(() => {
    setActiveMenu(null);
  }, []);

  const handleNewDocument = useCallback(() => {
    setShowNewDocDialog(true);
    closeMenu();
  }, [closeMenu]);

  const handleConfirmNewDocument = useCallback((title: string) => {
    createDocument(title);
    setShowNewDocDialog(false);
  }, [createDocument]);

  const handleNewDocumentFromTemplate = useCallback(() => {
    if (!activeDocumentId) {
      alert('Please open a document first to use it as a template');
      closeMenu();
      return;
    }
    setShowNewFromTemplateDialog(true);
    closeMenu();
  }, [activeDocumentId, closeMenu]);

  const handleConfirmNewFromTemplate = useCallback((title: string) => {
    if (!activeDocumentId) return;
    const newDocId = createDocumentFromTemplate(activeDocumentId, title);
    if (newDocId) {
      switchToDocument(newDocId);
    }
    setShowNewFromTemplateDialog(false);
  }, [createDocumentFromTemplate, activeDocumentId, switchToDocument]);

  const handleOpenDocumentManager = useCallback(() => {
    setShowDocumentManager(true);
    closeMenu();
  }, [closeMenu]);

  const handleOpenExample = useCallback(() => {
    const newDocId = createExampleDocument();
    if (newDocId) {
      switchToDocument(newDocId);
    }
    closeMenu();
  }, [createExampleDocument, switchToDocument, closeMenu]);

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

  const handleImportWorkspace = useCallback(async () => {
    // Importing a workspace overwrites the stored workspace wholesale, so name
    // what is about to be lost before opening the file picker.
    const openCount = documentOrder.length;
    const confirmed = await confirm({
      title: 'Import Workspace',
      message:
        openCount > 0
          ? `This replaces your current workspace — all ${openCount} open ${openCount === 1 ? 'document' : 'documents'} and your settings. Export your workspace first if you want to keep it.`
          : 'This replaces your current workspace and settings.',
      confirmLabel: 'Replace workspace',
      severity: 'danger',
    });
    if (confirmed) {
      importWorkspace();
    }
    closeMenu();
  }, [importWorkspace, closeMenu, confirm, documentOrder.length]);

  const handleConfigureActors = useCallback(() => {
    setShowNodeConfig(true);
    closeMenu();
  }, [closeMenu]);

  const handleConfigureRelations = useCallback(() => {
    setShowEdgeConfig(true);
    closeMenu();
  }, [closeMenu]);

  const handleConfigureLabels = useCallback(() => {
    setShowLabelConfig(true);
    closeMenu();
  }, [closeMenu]);

  const handleConfigureTangibles = useCallback(() => {
    setShowTangibleConfig(true);
    closeMenu();
  }, [closeMenu]);

  const handleManageBibliography = useCallback(() => {
    setShowBibliographyConfig(true);
    closeMenu();
  }, [closeMenu]);

  const handleUndo = useCallback(() => {
    undo();
    closeMenu();
  }, [undo, closeMenu]);

  const handleRedo = useCallback(() => {
    redo();
    closeMenu();
  }, [redo, closeMenu]);

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

  const handleExportPNG = useCallback(async () => {
    if (!onExport) return;
    try {
      await onExport('png');
      closeMenu();
    } catch (error) {
      console.error('PNG export failed:', error);
      alert('Failed to export graph as PNG');
    }
  }, [onExport, closeMenu]);

  const handleExportSVG = useCallback(async () => {
    if (!onExport) return;
    try {
      await onExport('svg');
      closeMenu();
    } catch (error) {
      console.error('SVG export failed:', error);
      alert('Failed to export graph as SVG');
    }
  }, [onExport, closeMenu]);

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

            {/* Wider than the other menus: these items carry a second line
                explaining what each export actually contains, and at the
                default menu width every one of them wrapped. */}
            {activeMenu === 'file' && (
              <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={handleNewDocument}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>New Document</span>
                  {getShortcutLabel('new-document') && (
                    <span className="text-xs text-gray-400">{getShortcutLabel('new-document')}</span>
                  )}
                </button>
                <button
                  onClick={handleNewDocumentFromTemplate}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={!activeDocumentId}
                >
                  New from Current Template
                </button>
                <button
                  onClick={handleOpenExample}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-100"
                >
                  <span className="block text-sm text-gray-700">Open Example Analysis</span>
                  <span className="block text-xs text-gray-500">A worked constellation to poke at</span>
                </button>
                <button
                  onClick={handleOpenDocumentManager}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>Document Manager</span>
                  {getShortcutLabel('open-document-manager') && (
                    <span className="text-xs text-gray-400">{getShortcutLabel('open-document-manager')}</span>
                  )}
                </button>

                <hr className="my-1 border-gray-200" />

                <div className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  This document
                </div>
                <button
                  onClick={handleImport}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-100"
                >
                  <span className="block text-sm text-gray-700">Import Document…</span>
                  <span className="block text-xs text-gray-500">Opens a .json file as a new document</span>
                </button>
                <button
                  onClick={handleExport}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-100"
                >
                  <span className="block text-sm text-gray-700">Export Document (JSON)</span>
                  <span className="block text-xs text-gray-500">All states — for backup or sharing</span>
                </button>
                <button
                  onClick={handleExportPNG}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-100 disabled:opacity-40"
                  disabled={!onExport || !activeDocumentId}
                >
                  <span className="block text-sm text-gray-700">Export as PNG Image</span>
                  <span className="block text-xs text-gray-500">Picture of the current state — not re-importable</span>
                </button>
                <button
                  onClick={handleExportSVG}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-100 disabled:opacity-40"
                  disabled={!onExport || !activeDocumentId}
                >
                  <span className="block text-sm text-gray-700">Export as SVG Vector</span>
                  <span className="block text-xs text-gray-500">Scalable picture — not re-importable</span>
                </button>

                <hr className="my-1 border-gray-200" />

                <div className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  All documents
                </div>
                <button
                  onClick={handleExportAll}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-100"
                >
                  <span className="block text-sm text-gray-700">Export All as ZIP</span>
                  <span className="block text-xs text-gray-500">Every document as a separate file</span>
                </button>
                <button
                  onClick={handleExportWorkspace}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-100"
                >
                  <span className="block text-sm text-gray-700">Export Workspace</span>
                  <span className="block text-xs text-gray-500">Every document, plus tabs and settings</span>
                </button>
                <button
                  onClick={handleImportWorkspace}
                  className="w-full text-left px-4 py-1.5 hover:bg-red-50"
                >
                  <span className="block text-sm text-red-700">Import Workspace…</span>
                  <span className="block text-xs text-red-600">Replaces everything currently open</span>
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
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
                  title={undoDescription ? `Undo: ${undoDescription}` : 'Undo'}
                >
                  <span>Undo{undoDescription ? `: ${undoDescription}` : ''}</span>
                  {getShortcutLabel('undo') && (
                    <span className="text-xs text-gray-400">{getShortcutLabel('undo')}</span>
                  )}
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
                  title={redoDescription ? `Redo: ${redoDescription}` : 'Redo'}
                >
                  <span>Redo{redoDescription ? `: ${redoDescription}` : ''}</span>
                  {getShortcutLabel('redo') && (
                    <span className="text-xs text-gray-400">{getShortcutLabel('redo')}</span>
                  )}
                </button>

                <hr className="my-1 border-gray-200" />

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
                <button
                  onClick={handleConfigureLabels}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Configure Labels
                </button>
                <button
                  onClick={handleConfigureTangibles}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Configure Tangibles
                </button>
                <button
                  onClick={handleManageBibliography}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Manage Bibliography
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
              <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    onFitView?.();
                    closeMenu();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>Fit View to Content</span>
                  {getShortcutLabel('fit-view') && (
                    <span className="text-xs text-gray-400">{getShortcutLabel('fit-view')}</span>
                  )}
                </button>

                {/* Presentation Mode */}
                <button
                  onClick={() => {
                    setPresentationMode(true);
                    closeMenu();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  <span className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Presentation Mode</span>
                    <span className="text-xs text-gray-400">F11</span>
                  </span>
                  <span className="block text-xs text-gray-500">Fullscreen, no panels — press Esc to come back</span>
                </button>

                <div className="border-t border-gray-200 my-1" />

                {/* TUIO Connection Settings */}
                <button
                  onClick={() => {
                    setShowTuioConfig(true);
                    closeMenu();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  TUIO Connection Settings...
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
              <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    setShowConceptIndex(true);
                    closeMenu();
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-gray-100"
                >
                  <span className="block text-sm text-gray-700">How this works</span>
                  <span className="block text-xs text-gray-500">
                    Actors, relations, states and the rest, explained
                  </span>
                </button>

                <hr className="my-1 border-gray-200" />

                <button
                  onClick={() => {
                    onOpenHelp?.();
                    closeMenu();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>Keyboard Shortcuts</span>
                  {getShortcutLabel('show-help') && (
                    <span className="text-xs text-gray-400">{getShortcutLabel('show-help')}</span>
                  )}
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
      <LabelConfigModal
        isOpen={showLabelConfig}
        onClose={() => setShowLabelConfig(false)}
      />
      <TangibleConfigModal
        isOpen={showTangibleConfig}
        onClose={() => setShowTangibleConfig(false)}
      />
      <TuioConnectionConfig
        isOpen={showTuioConfig}
        onClose={() => setShowTuioConfig(false)}
      />
      <BibliographyConfigModal
        isOpen={showBibliographyConfig}
        onClose={() => setShowBibliographyConfig(false)}
      />
      <ConceptIndex
        isOpen={showConceptIndex}
        onClose={() => setShowConceptIndex(false)}
      />

      {/* Input Dialogs */}
      <InputDialog
        isOpen={showNewDocDialog}
        title="New Document"
        message="Enter a name for the new document:"
        placeholder="e.g., Team Analysis, Project Relationships..."
        defaultValue="Untitled Analysis"
        confirmLabel="Create"
        onConfirm={handleConfirmNewDocument}
        onCancel={() => setShowNewDocDialog(false)}
        validateInput={(value) => {
          if (!value.trim()) return 'Document name cannot be empty';
          return null;
        }}
      />
      <InputDialog
        isOpen={showNewFromTemplateDialog}
        title="New Document from Template"
        message="Enter a name for the new document:"
        placeholder="e.g., Team Analysis, Project Relationships..."
        defaultValue="Untitled Analysis"
        confirmLabel="Create"
        onConfirm={handleConfirmNewFromTemplate}
        onCancel={() => setShowNewFromTemplateDialog(false)}
        validateInput={(value) => {
          if (!value.trim()) return 'Document name cannot be empty';
          return null;
        }}
      />

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </>
  );
};

export default MenuBar;
