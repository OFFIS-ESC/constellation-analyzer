import { useEffect } from "react";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useSettingsStore } from "../stores/settingsStore";
import type { KeyboardShortcut } from "./useKeyboardShortcutManager";

/**
 * useGlobalShortcuts Hook
 *
 * Registers all global keyboard shortcuts for the application.
 * This centralizes shortcut registration and makes them discoverable.
 */

interface UseGlobalShortcutsOptions {
  onNewDocument?: () => void;
  onOpenDocumentManager?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenHelp?: () => void;
  onFitView?: () => void;
  onFocusSearch?: () => void;
}

export function useGlobalShortcuts(options: UseGlobalShortcutsOptions = {}) {
  const { shortcuts } = useKeyboardShortcuts();
  const {
    documentOrder,
    activeDocumentId,
    switchToDocument,
    closeDocument,
    saveDocument,
  } = useWorkspaceStore();
  const { presentationMode, setPresentationMode } = useSettingsStore();

  useEffect(() => {
    const shortcutDefinitions: KeyboardShortcut[] = [
      // Document Management
      {
        id: "new-document",
        description: "New Document",
        key: "n",
        ctrl: true,
        handler: () => options.onNewDocument?.(),
        category: "Document Management",
        enabled: !!options.onNewDocument,
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
        id: "toggle-presentation-mode",
        description: "Toggle Presentation Mode",
        key: "F11",
        handler: () => {
          setPresentationMode(!presentationMode);
        },
        category: "View",
      },
      {
        id: "exit-presentation-mode",
        description: "Exit Presentation Mode",
        key: "Escape",
        handler: () => {
          if (presentationMode) {
            setPresentationMode(false);
          }
        },
        category: "View",
        priority: 10, // Higher priority to handle before other Escape handlers
      },
      {
        id: "show-help",
        description: "Show Keyboard Shortcuts",
        key: "?",
        ctrl: true,
        handler: () => options.onOpenHelp?.(),
        category: "Navigation",
        enabled: !!options.onOpenHelp,
      },
      {
        id: "focus-search",
        description: "Focus Search",
        key: "f",
        ctrl: true,
        handler: () => options.onFocusSearch?.(),
        category: "Navigation",
        enabled: !!options.onFocusSearch,
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
    saveDocument,
    presentationMode,
    setPresentationMode,
    options,
  ]);
}
