import { useState, useCallback, useEffect } from "react";
import { ReactFlowProvider, useReactFlow } from "reactflow";
import GraphEditor from "./components/Editor/GraphEditor";
import LeftPanel from "./components/Panels/LeftPanel";
import RightPanel from "./components/Panels/RightPanel";
import DocumentTabs from "./components/Workspace/DocumentTabs";
import Toolbar from "./components/Toolbar/Toolbar";
import MenuBar from "./components/Menu/MenuBar";
import DocumentManager from "./components/Workspace/DocumentManager";
import KeyboardShortcutsHelp from "./components/Common/KeyboardShortcutsHelp";
import ToastContainer from "./components/Common/ToastContainer";
import { KeyboardShortcutProvider } from "./contexts/KeyboardShortcutContext";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useDocumentHistory } from "./hooks/useDocumentHistory";
import { useWorkspaceStore } from "./stores/workspaceStore";
import { usePanelStore } from "./stores/panelStore";
import type { Actor, Relation } from "./types";
import type { ExportOptions } from "./utils/graphExport";

/**
 * App - Root application component
 *
 * Layout:
 * - Header with title
 * - Menu bar (File, Edit, View)
 * - Document tabs for multi-file support
 * - Toolbar for graph editing controls
 * - Main graph editor canvas
 *
 * Features:
 * - Responsive layout
 * - ReactFlowProvider wrapper for graph functionality
 * - Multi-document workspace with tabs
 * - Organized menu system for file and editing operations
 * - Per-document undo/redo with keyboard shortcuts
 * - Centralized keyboard shortcut management system
 */

/** Inner component that has access to ReactFlow context */
function AppContent() {
  const { undo, redo } = useDocumentHistory();
  const { activeDocumentId } = useWorkspaceStore();
  const { toggleLeftPanel, toggleRightPanel, leftPanelVisible, rightPanelVisible } = usePanelStore();
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Actor | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Relation | null>(null);
  const [addNodeCallback, setAddNodeCallback] = useState<((nodeTypeId: string, position?: { x: number; y: number }) => void) | null>(null);
  const [exportCallback, setExportCallback] = useState<((format: 'png' | 'svg', options?: ExportOptions) => Promise<void>) | null>(null);
  const { fitView } = useReactFlow();


  // Listen for document manager open event from EmptyState
  useEffect(() => {
    const handleOpenDocumentManager = () => {
      setShowDocumentManager(true);
    };
    window.addEventListener("openDocumentManager", handleOpenDocumentManager);
    return () =>
      window.removeEventListener(
        "openDocumentManager",
        handleOpenDocumentManager,
      );
  }, []);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  const handleSelectAll = useCallback(() => {
    // This will be implemented in GraphEditor
    // For now, we'll just document it
    console.log("Select All - to be implemented");
  }, []);

  // Setup global keyboard shortcuts
  useGlobalShortcuts({
    onUndo: undo,
    onRedo: redo,
    onOpenDocumentManager: () => setShowDocumentManager(true),
    onOpenHelp: () => setShowKeyboardHelp(true),
    onFitView: handleFitView,
    onSelectAll: handleSelectAll,
  });

  // Escape key to close property panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: Close property panels
      if (e.key === 'Escape') {
        if (selectedNode || selectedEdge) {
          e.preventDefault();
          setSelectedNode(null);
          setSelectedEdge(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src="favicon.svg"
              alt="Constellation Analyzer Logo"
              className="w-10 h-10"
            />
            <div>
              <h1 className="text-2xl font-bold">Constellation Analyzer</h1>
              <p className="text-sm text-blue-100 mt-1">
                Visual editor for analyzing actors and their relationships
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Bar */}
      <MenuBar
        onOpenHelp={() => setShowKeyboardHelp(true)}
        onFitView={handleFitView}
        onSelectAll={handleSelectAll}
        onExport={exportCallback || undefined}
      />

      {/* Document Tabs */}
      <DocumentTabs />

      {/* Toolbar */}
      {activeDocumentId && <Toolbar />}

      {/* Main content area with side panels */}
      <main className="flex-1 overflow-hidden flex">
        {/* Left Panel */}
        {leftPanelVisible && activeDocumentId && (
          <LeftPanel
            onDeselectAll={() => {
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
            onAddNode={addNodeCallback || undefined}
          />
        )}

        {/* Center: Graph Editor */}
        <div className="flex-1 overflow-hidden">
          <GraphEditor
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onNodeSelect={(node) => {
              setSelectedNode(node);
              // Only clear edge if we're setting a node (not clearing)
              if (node) {
                setSelectedEdge(null);
              }
            }}
            onEdgeSelect={(edge) => {
              setSelectedEdge(edge);
              // Only clear node if we're setting an edge (not clearing)
              if (edge) {
                setSelectedNode(null);
              }
            }}
            onAddNodeRequest={(callback: (nodeTypeId: string, position?: { x: number; y: number }) => void) => setAddNodeCallback(() => callback)}
            onExportRequest={(callback: (format: 'png' | 'svg', options?: ExportOptions) => Promise<void>) => setExportCallback(() => callback)}
          />
        </div>

        {/* Right Panel */}
        {rightPanelVisible && activeDocumentId && (
          <RightPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onClose={() => {
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
          />
        )}
      </main>

      {/* Document Manager Modal */}
      <DocumentManager
        isOpen={showDocumentManager}
        onClose={() => setShowDocumentManager(false)}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <KeyboardShortcutProvider>
      <ReactFlowProvider>
        <AppContent />
      </ReactFlowProvider>
    </KeyboardShortcutProvider>
  );
}

export default App;
