import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings Store - Global application settings with localStorage persistence
 *
 * Features:
 * - Search and filter preferences
 * - UI behavior settings
 * - Auto-save to localStorage
 * - Extendable for future settings
 */

interface SettingsState {
  // Search & Filter Settings
  autoZoomEnabled: boolean;
  setAutoZoomEnabled: (enabled: boolean) => void;

  // Future settings can be added here
  // Example:
  // theme: 'light' | 'dark';
  // setTheme: (theme: 'light' | 'dark') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Search & Filter Settings
      autoZoomEnabled: true,
      setAutoZoomEnabled: (enabled: boolean) =>
        set({ autoZoomEnabled: enabled }),

      // Future settings implementations go here
    }),
    {
      name: 'constellation-settings', // localStorage key
      version: 1, // For future migrations if needed
    }
  )
);
