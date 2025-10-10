import { createContext } from "react";
import { useKeyboardShortcutManager } from "../hooks/useKeyboardShortcutManager";

export interface KeyboardShortcutContextValue {
  shortcuts: ReturnType<typeof useKeyboardShortcutManager>;
}

export const KeyboardShortcutContext =
  createContext<KeyboardShortcutContextValue | null>(null);
