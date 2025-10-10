import { create } from 'zustand';
import type { EditorSettings, EditorActions } from '../types';

const defaultSettings: EditorSettings = {
  snapToGrid: false,
  showGrid: true,
  gridSize: 15,
  panOnDrag: true,
  zoomOnScroll: true,
};

interface EditorStore extends EditorSettings {
  selectedRelationType: string | null;
  setSelectedRelationType: (typeId: string) => void;
}

export const useEditorStore = create<EditorStore & EditorActions>((set) => ({
  ...defaultSettings,
  selectedRelationType: null,

  updateSettings: (settings: Partial<EditorSettings>) =>
    set((state) => ({
      ...state,
      ...settings,
    })),

  setSelectedRelationType: (typeId: string) =>
    set({ selectedRelationType: typeId }),
}));
