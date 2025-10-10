import React, { createContext, useContext, ReactNode } from 'react';
import { useKeyboardShortcutManager } from '../hooks/useKeyboardShortcutManager';

/**
 * Keyboard Shortcut Context
 *
 * Provides centralized keyboard shortcut management throughout the application.
 * Components can register shortcuts and the system handles conflicts and priorities.
 */

interface KeyboardShortcutContextValue {
  shortcuts: ReturnType<typeof useKeyboardShortcutManager>;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextValue | null>(null);

interface KeyboardShortcutProviderProps {
  children: ReactNode;
}

export const KeyboardShortcutProvider: React.FC<KeyboardShortcutProviderProps> = ({
  children,
}) => {
  const shortcuts = useKeyboardShortcutManager();

  return (
    <KeyboardShortcutContext.Provider value={{ shortcuts }}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
};

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
      'useKeyboardShortcuts must be used within KeyboardShortcutProvider'
    );
  }
  return context;
}
