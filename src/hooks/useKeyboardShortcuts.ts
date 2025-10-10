import { useContext } from "react";
import { KeyboardShortcutContext } from "../contexts/keyboardShortcut";

/**
 * Hook to access keyboard shortcut manager
 *
 * Usage:
 * ```tsx
 * const { shortcuts } = useKeyboardShortcuts();
 *
 * useEffect(() => {
 *   shortcuts.register({...});
 *   return () => shortcuts.unregister('id');
 * }, []);
 * ```
 */
export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutContext);
  if (!context) {
    throw new Error(
      "useKeyboardShortcuts must be used within KeyboardShortcutProvider",
    );
  }
  return context;
}
