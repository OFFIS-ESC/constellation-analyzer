import { create } from 'zustand';

/**
 * Show and hide choices made while presenting.
 *
 * Presentation mode must not change the document, but a presenter still needs
 * to open and close quotes. These choices sit on top of the saved state and are
 * dropped when presentation mode ends.
 */
interface RelationDescriptionViewState {
  visibilityOverrides: Record<string, boolean>;
  setVisibilityOverrides: (ids: string[], visible: boolean) => void;
  clearVisibilityOverrides: () => void;
}

export const useRelationDescriptionViewStore = create<RelationDescriptionViewState>((set) => ({
  visibilityOverrides: {},
  setVisibilityOverrides: (ids, visible) =>
    set((state) => ({
      visibilityOverrides: {
        ...state.visibilityOverrides,
        ...Object.fromEntries(ids.map((id) => [id, visible])),
      },
    })),
  clearVisibilityOverrides: () => set({ visibilityOverrides: {} }),
}));
