import { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider, useReactFlow } from 'reactflow';
import GraphEditor from './components/Editor/GraphEditor';
import Toolbar from './components/Toolbar/Toolbar';
import DocumentTabs from './components/Workspace/DocumentTabs';
import MenuBar from './components/Menu/MenuBar';
import DocumentManager from './components/Workspace/DocumentManager';
import KeyboardShortcutsHelp from './components/Common/KeyboardShortcutsHelp';
import { KeyboardShortcutProvider } from './contexts/KeyboardShortcutContext';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useDocumentHistory } from './hooks/useDocumentHistory';
import { useWorkspaceStore } from './stores/workspaceStore';

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
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const { fitView } = useReactFlow();

  // Listen for document manager open event from EmptyState
  useEffect(() => {
    const handleOpenDocumentManager = () => {
      setShowDocumentManager(true);
    };
    window.addEventListener('openDocumentManager', handleOpenDocumentManager);
    return () => window.removeEventListener('openDocumentManager', handleOpenDocumentManager);
  }, []);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  const handleSelectAll = useCallback(() => {
    // This will be implemented in GraphEditor
    // For now, we'll just document it
    console.log('Select All - to be implemented');
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

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Constellation Analyzer Logo" className="w-10 h-10" />
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
      />

      {/* Document Tabs */}
      <DocumentTabs />

      {/* Toolbar - only show when a document is active */}
      {activeDocumentId && <Toolbar />}

      {/* Main graph editor */}
      <main className="flex-1 overflow-hidden">
        <GraphEditor />
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
