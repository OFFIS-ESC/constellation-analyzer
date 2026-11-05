import { useCallback, useEffect } from 'react';
import { useGraphWithHistory } from './useGraphWithHistory';
import { useSettingsStore } from '../stores/settingsStore';
import { useRelationDescriptionViewStore } from '../stores/relationDescriptionViewStore';

/**
 * Shows or hides relation description boxes. While editing this changes the
 * document and can be undone, like minimizing a group. While presenting it only
 * changes the current view.
 */
export function useSetRelationDescriptionsVisible() {
  const { setRelationDescriptionsVisible } = useGraphWithHistory();
  const presentationMode = useSettingsStore((state) => state.presentationMode);
  const setVisibilityOverrides = useRelationDescriptionViewStore((state) => state.setVisibilityOverrides);

  return useCallback(
    (ids: string[], visible: boolean) => {
      if (ids.length === 0) return;
      if (presentationMode) {
        setVisibilityOverrides(ids, visible);
      } else {
        setRelationDescriptionsVisible(ids, visible);
      }
    },
    [presentationMode, setVisibilityOverrides, setRelationDescriptionsVisible]
  );
}

/** Drops the choices made while presenting once presentation mode ends. */
export function useResetDescriptionViewAfterPresenting() {
  const presentationMode = useSettingsStore((state) => state.presentationMode);
  const clearVisibilityOverrides = useRelationDescriptionViewStore((state) => state.clearVisibilityOverrides);

  useEffect(() => {
    if (!presentationMode) clearVisibilityOverrides();
  }, [presentationMode, clearVisibilityOverrides]);
}
