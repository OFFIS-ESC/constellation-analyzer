import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard Shortcut Manager
 *
 * Centralized system for managing keyboard shortcuts across the application.
 * Provides:
 * - Conflict detection and prevention
 * - Priority-based shortcut handling
 * - Platform-aware modifier keys (Cmd on Mac, Ctrl elsewhere)
 * - Easy registration and unregistration of shortcuts
 * - Shortcut documentation for help UI
 */

export interface KeyboardShortcut {
  /** Unique identifier for this shortcut */
  id: string;
  /** Human-readable description */
  description: string;
  /** Key combination (e.g., 'n', 'Tab', 'z') */
  key: string;
  /** Requires Ctrl (Windows/Linux) or Cmd (Mac) */
  ctrl?: boolean;
  /** Requires Shift */
  shift?: boolean;
  /** Requires Alt/Option */
  alt?: boolean;
  /** Handler function */
  handler: () => void;
  /** Priority (higher number = higher priority, default: 0) */
  priority?: number;
  /** Category for grouping in help UI */
  category: ShortcutCategory;
  /** Whether shortcut is currently enabled */
  enabled?: boolean;
}

export type ShortcutCategory =
  | 'Document Management'
  | 'Graph Editing'
  | 'View'
  | 'Selection'
  | 'Navigation';

interface KeyboardShortcutManager {
  /** Register a new keyboard shortcut */
  register: (shortcut: KeyboardShortcut) => void;
  /** Unregister a keyboard shortcut by id */
  unregister: (id: string) => void;
  /** Get all registered shortcuts */
  getAllShortcuts: () => KeyboardShortcut[];
  /** Get shortcuts by category */
  getShortcutsByCategory: (category: ShortcutCategory) => KeyboardShortcut[];
  /** Format shortcut for display (e.g., "Ctrl+N") */
  formatShortcut: (shortcut: KeyboardShortcut) => string;
  /** Check if shortcut is on Mac platform */
  isMac: boolean;
}

/**
 * Hook for centralized keyboard shortcut management
 *
 * Usage:
 * ```tsx
 * const shortcuts = useKeyboardShortcutManager();
 *
 * useEffect(() => {
 *   shortcuts.register({
 *     id: 'new-document',
 *     description: 'Create new document',
 *     key: 'n',
 *     ctrl: true,
 *     handler: () => createDocument(),
 *     category: 'Document Management'
 *   });
 *   return () => shortcuts.unregister('new-document');
 * }, []);
 * ```
 */
export function useKeyboardShortcutManager(): KeyboardShortcutManager {
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const register = useCallback((shortcut: KeyboardShortcut) => {
    const shortcuts = shortcutsRef.current;

    // Check for conflicts
    const conflict = Array.from(shortcuts.values()).find(
      existing =>
        existing.key === shortcut.key &&
        existing.ctrl === shortcut.ctrl &&
        existing.shift === shortcut.shift &&
        existing.alt === shortcut.alt &&
        existing.id !== shortcut.id
    );

    if (conflict) {
      console.warn(
        `Keyboard shortcut conflict detected: "${shortcut.id}" conflicts with "${conflict.id}"`,
        `Both use: ${formatShortcutInternal(shortcut, isMac)}`
      );
    }

    shortcuts.set(shortcut.id, { ...shortcut, enabled: shortcut.enabled !== false });
  }, [isMac]);

  const unregister = useCallback((id: string) => {
    shortcutsRef.current.delete(id);
  }, []);

  const getAllShortcuts = useCallback(() => {
    return Array.from(shortcutsRef.current.values());
  }, []);

  const getShortcutsByCategory = useCallback((category: ShortcutCategory) => {
    return Array.from(shortcutsRef.current.values()).filter(
      shortcut => shortcut.category === category
    );
  }, []);

  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    return formatShortcutInternal(shortcut, isMac);
  }, [isMac]);

  // Global event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcuts = shortcutsRef.current;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Find matching shortcuts
      const matches = Array.from(shortcuts.values()).filter(shortcut => {
        if (!shortcut.enabled) return false;

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? modifier : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matches.length > 0) {
        // Sort by priority (higher first)
        matches.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Execute highest priority handler
        e.preventDefault();
        matches[0].handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMac]);

  return {
    register,
    unregister,
    getAllShortcuts,
    getShortcutsByCategory,
    formatShortcut,
    isMac,
  };
}

/**
 * Helper function to format shortcut for display
 */
function formatShortcutInternal(shortcut: KeyboardShortcut, isMac: boolean): string {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push(isMac ? 'Cmd' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? 'Option' : 'Alt');
  }

  // Format key name
  let keyName = shortcut.key;
  if (keyName === ' ') keyName = 'Space';
  else if (keyName.length === 1) keyName = keyName.toUpperCase();
  else keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1);

  parts.push(keyName);

  return parts.join('+');
}
