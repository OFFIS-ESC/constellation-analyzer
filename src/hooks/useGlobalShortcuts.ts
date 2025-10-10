import { useEffect } from "react";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useWorkspaceStore } from "../stores/workspaceStore";
import type { KeyboardShortcut } from "./useKeyboardShortcutManager";

/**
 * useGlobalShortcuts Hook
 *
 * Registers all global keyboard shortcuts for the application.
 * This centralizes shortcut registration and makes them discoverable.
 */

interface UseGlobalShortcutsOptions {
  onOpenDocumentManager?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenHelp?: () => void;
  onFitView?: () => void;
  onSelectAll?: () => void;
}

export function useGlobalShortcuts(options: UseGlobalShortcutsOptions = {}) {
  const { shortcuts } = useKeyboardShortcuts();
  const {
    documentOrder,
    activeDocumentId,
    switchToDocument,
    closeDocument,
    createDocument,
    saveDocument,
  } = useWorkspaceStore();

  useEffect(() => {
    const shortcutDefinitions: KeyboardShortcut[] = [
      // Document Management
      {
        id: "new-document",
        description: "New Document",
        key: "n",
        ctrl: true,
        handler: () => createDocument(),
        category: "Document Management",
      },
      {
        id: "open-document-manager",
        description: "Document Manager",
        key: "o",
        ctrl: true,
        handler: () => options.onOpenDocumentManager?.(),
        category: "Document Management",
        enabled: !!options.onOpenDocumentManager,
      },
      {
        id: "save-document",
        description: "Export Document",
        key: "s",
        ctrl: true,
        handler: () => {
          if (activeDocumentId) {
            saveDocument(activeDocumentId);
          }
        },
        category: "Document Management",
      },
      {
        id: "close-document",
        description: "Close Current Document",
        key: "w",
        ctrl: true,
        handler: () => {
          if (activeDocumentId && documentOrder.length > 1) {
            closeDocument(activeDocumentId);
          }
        },
        category: "Document Management",
      },
      {
        id: "next-document",
        description: "Next Document",
        key: "Tab",
        ctrl: true,
        handler: () => {
          const currentIndex = documentOrder.findIndex(
            (id) => id === activeDocumentId,
          );
          if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % documentOrder.length;
            switchToDocument(documentOrder[nextIndex]);
          }
        },
        category: "Navigation",
      },
      {
        id: "previous-document",
        description: "Previous Document",
        key: "Tab",
        ctrl: true,
        shift: true,
        handler: () => {
          const currentIndex = documentOrder.findIndex(
            (id) => id === activeDocumentId,
          );
          if (currentIndex !== -1) {
            const prevIndex =
              (currentIndex - 1 + documentOrder.length) % documentOrder.length;
            switchToDocument(documentOrder[prevIndex]);
          }
        },
        category: "Navigation",
      },

      // Graph Editing
      {
        id: "undo",
        description: "Undo",
        key: "z",
        ctrl: true,
        handler: () => options.onUndo?.(),
        category: "Graph Editing",
        enabled: !!options.onUndo,
      },
      {
        id: "redo",
        description: "Redo",
        key: "y",
        ctrl: true,
        handler: () => options.onRedo?.(),
        category: "Graph Editing",
        enabled: !!options.onRedo,
      },
      {
        id: "redo-alt",
        description: "Redo",
        key: "z",
        ctrl: true,
        shift: true,
        handler: () => options.onRedo?.(),
        category: "Graph Editing",
        enabled: !!options.onRedo,
        priority: -1, // Lower priority than Ctrl+Y
      },

      // Selection
      {
        id: "select-all",
        description: "Select All",
        key: "a",
        ctrl: true,
        handler: () => options.onSelectAll?.(),
        category: "Selection",
        enabled: !!options.onSelectAll,
      },
      {
        id: "deselect-all",
        description: "Deselect All",
        key: "Escape",
        handler: () => {
          // This will be handled by GraphEditor
          // Just documenting it here
        },
        category: "Selection",
        enabled: false, // React Flow handles this internally
      },

      // View
      {
        id: "fit-view",
        description: "Fit View to Content",
        key: "f",
        ctrl: true,
        shift: true,
        handler: () => options.onFitView?.(),
        category: "View",
        enabled: !!options.onFitView,
      },
      {
        id: "show-help",
        description: "Show Keyboard Shortcuts",
        key: "?",
        handler: () => options.onOpenHelp?.(),
        category: "Navigation",
        enabled: !!options.onOpenHelp,
      },
    ];

    // Register all shortcuts
    shortcutDefinitions.forEach((shortcut) => {
      shortcuts.register(shortcut);
    });

    // Cleanup on unmount
    return () => {
      shortcutDefinitions.forEach((shortcut) => {
        shortcuts.unregister(shortcut.id);
      });
    };
  }, [
    shortcuts,
    documentOrder,
    activeDocumentId,
    switchToDocument,
    closeDocument,
    createDocument,
    saveDocument,
    options,
  ]);
}
