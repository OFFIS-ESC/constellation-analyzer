import { useEffect } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';

/**
 * useKeyboardShortcuts Hook
 *
 * Global keyboard shortcuts for the application:
 * - Ctrl/Cmd + Tab: Next document
 * - Ctrl/Cmd + Shift + Tab: Previous document
 * - Ctrl/Cmd + W: Close current document
 * - Ctrl/Cmd + N: New document
 * - Ctrl/Cmd + S: Save current document (trigger save immediately)
 * - Ctrl/Cmd + O: Open document manager
 * - Ctrl/Cmd + Z: Undo (per-document)
 * - Ctrl/Cmd + Y / Ctrl/Cmd + Shift + Z: Redo (per-document)
 */

interface UseKeyboardShortcutsOptions {
  onOpenDocumentManager?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useKeyboardShortcuts(options?: UseKeyboardShortcutsOptions) {
  const {
    documentOrder,
    activeDocumentId,
    switchToDocument,
    closeDocument,
    createDocument,
    saveDocument,
  } = useWorkspaceStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Tab - Next document
      if (modifier && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = documentOrder.findIndex(id => id === activeDocumentId);
        if (currentIndex !== -1) {
          const nextIndex = (currentIndex + 1) % documentOrder.length;
          switchToDocument(documentOrder[nextIndex]);
        }
        return;
      }

      // Ctrl/Cmd + Shift + Tab - Previous document
      if (modifier && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const currentIndex = documentOrder.findIndex(id => id === activeDocumentId);
        if (currentIndex !== -1) {
          const prevIndex = (currentIndex - 1 + documentOrder.length) % documentOrder.length;
          switchToDocument(documentOrder[prevIndex]);
        }
        return;
      }

      // Ctrl/Cmd + W - Close current document
      if (modifier && e.key === 'w') {
        e.preventDefault();
        if (activeDocumentId && documentOrder.length > 1) {
          closeDocument(activeDocumentId);
        }
        return;
      }

      // Ctrl/Cmd + N - New document
      if (modifier && e.key === 'n') {
        e.preventDefault();
        createDocument();
        return;
      }

      // Ctrl/Cmd + S - Save current document
      if (modifier && e.key === 's') {
        e.preventDefault();
        if (activeDocumentId) {
          saveDocument(activeDocumentId);
        }
        return;
      }

      // Ctrl/Cmd + O - Open document manager
      if (modifier && e.key === 'o') {
        e.preventDefault();
        options?.onOpenDocumentManager?.();
        return;
      }

      // Ctrl/Cmd + Z - Undo
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        options?.onUndo?.();
        return;
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z - Redo
      if (modifier && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        options?.onRedo?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    documentOrder,
    activeDocumentId,
    switchToDocument,
    closeDocument,
    createDocument,
    saveDocument,
    options,
  ]);
}
