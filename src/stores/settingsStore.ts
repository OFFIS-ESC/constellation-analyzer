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

  // Presentation Mode Settings
  presentationMode: boolean;
  setPresentationMode: (enabled: boolean) => void;

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

      // Presentation Mode Settings
      presentationMode: false,
      setPresentationMode: (enabled: boolean) => {
        set({ presentationMode: enabled });

        // Handle fullscreen mode
        if (enabled) {
          // Enter fullscreen
          console.log('[Settings] Entering presentation mode, requesting fullscreen');
          const docElement = document.documentElement;
          if (docElement.requestFullscreen) {
            docElement.requestFullscreen().catch((err) => {
              console.warn('[Settings] Failed to enter fullscreen:', err);
            });
          }
        } else {
          // Exit fullscreen
          console.log('[Settings] Exiting presentation mode, exiting fullscreen');
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch((err) => {
              console.warn('[Settings] Failed to exit fullscreen:', err);
            });
          }
        }
      },

      // Future settings implementations go here
    }),
    {
      name: 'constellation-settings', // localStorage key
      version: 1, // For future migrations if needed
    }
  )
);
