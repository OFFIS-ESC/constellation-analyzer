import { useCallback } from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

/**
 * useShortcutLabels Hook
 *
 * Provides a convenient API for getting formatted keyboard shortcut labels
 * from the centralized keyboard shortcut manager.
 *
 * This hook is useful for displaying shortcuts in:
 * - Menu items
 * - Tooltips
 * - Context menus
 * - Button labels
 * - Any UI element that needs to show keyboard shortcuts
 *
 * Usage:
 * ```tsx
 * const { getShortcutLabel } = useShortcutLabels();
 * const label = getShortcutLabel('new-document'); // Returns "Ctrl+N" or "Cmd+N" on Mac
 * ```
 */
export function useShortcutLabels() {
  const { shortcuts } = useKeyboardShortcuts();

  /**
   * Get the formatted label for a keyboard shortcut by its ID
   *
   * @param shortcutId - The unique identifier for the shortcut
   * @returns Formatted shortcut string (e.g., "Ctrl+N") or null if shortcut doesn't exist or is disabled
   */
  const getShortcutLabel = useCallback(
    (shortcutId: string): string | null => {
      const allShortcuts = shortcuts.getAllShortcuts();
      const shortcut = allShortcuts.find((s) => s.id === shortcutId);

      // Return null if shortcut doesn't exist or is disabled
      if (!shortcut || shortcut.enabled === false) {
        return null;
      }

      return shortcuts.formatShortcut(shortcut);
    },
    [shortcuts]
  );

  return { getShortcutLabel };
}
