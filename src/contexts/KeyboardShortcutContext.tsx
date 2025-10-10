import React, { ReactNode } from "react";
import { useKeyboardShortcutManager } from "../hooks/useKeyboardShortcutManager";
import { KeyboardShortcutContext } from "./keyboardShortcut";

interface KeyboardShortcutProviderProps {
  children: ReactNode;
}

export const KeyboardShortcutProvider: React.FC<
  KeyboardShortcutProviderProps
> = ({ children }) => {
  const shortcuts = useKeyboardShortcutManager();

  return (
    <KeyboardShortcutContext.Provider value={{ shortcuts }}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
};