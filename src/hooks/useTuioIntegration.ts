import { useEffect, useRef } from 'react';
import { useTuioStore } from '../stores/tuioStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGraphStore } from '../stores/graphStore';
import { useTimelineStore } from '../stores/timelineStore';
import { TuioClientManager } from '../lib/tuio/tuioClient';
import type { TuioTangibleInfo } from '../lib/tuio/types';
import type { TangibleConfig } from '../types';
import { migrateTangibleConfig } from '../utils/tangibleMigration';

/**
 * TUIO Integration Hook
 * Manages TUIO client lifecycle and integrates tangible detection with application stores
 *
 * Behavior:
 * - Connects to TUIO server when presentation mode is enabled
 * - Disconnects when presentation mode is disabled
 * - Maps detected tangibles to configured tangible actions
 * - Filter mode: Activates label filters
 * - State mode: Switches timeline state
 */
export function useTuioIntegration() {
  const clientRef = useRef<TuioClientManager | null>(null);
  const { presentationMode } = useSettingsStore();
  const { websocketUrl, protocolVersion } = useTuioStore();

  useEffect(() => {
    // Only connect in presentation mode
    if (!presentationMode) {
      // Disconnect if we're leaving presentation mode
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
        useTuioStore.getState().clearActiveTangibles();
      }
      return;
    }


    // Create TUIO client if in presentation mode
    const client = new TuioClientManager(
      {
        onTangibleAdd: handleTangibleAdd,
        onTangibleUpdate: handleTangibleUpdate,
        onTangibleRemove: handleTangibleRemove,
        onConnectionChange: (connected, error) => {
          useTuioStore.getState().setConnectionState(connected, error);
        },
      },
      protocolVersion
    );

    clientRef.current = client;

    // Connect to TUIO server
    client
      .connect(websocketUrl)
      .catch(() => {
        // Connection errors are handled by onConnectionChange callback
      });

    // Cleanup on unmount or when presentation mode changes
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
        useTuioStore.getState().clearActiveTangibles();
      }
    };
  }, [presentationMode, websocketUrl, protocolVersion]);
}

/**
 * Handle tangible add event
 */
function handleTangibleAdd(hardwareId: string, info: TuioTangibleInfo): void {

  // Update TUIO store
  useTuioStore.getState().addActiveTangible(hardwareId, info);

  // Find matching tangible configuration
  const tangibles = useGraphStore.getState().tangibles;
  const tangibleConfig = tangibles.find((t) => t.hardwareId === hardwareId);

  if (!tangibleConfig) {
    // Unknown hardware ID - silently ignore
    return;
  }


  // Trigger action based on tangible mode
  if (tangibleConfig.mode === 'filter') {
    applyFilterTangible();
  } else if (tangibleConfig.mode === 'state') {
    applyStateTangible(tangibleConfig, hardwareId);
  }
  // 'stateDial' mode ignored for now
}

/**
 * Handle tangible update event
 * Currently just updates position/angle in store (for future stateDial support)
 */
function handleTangibleUpdate(hardwareId: string, info: TuioTangibleInfo): void {
  useTuioStore.getState().updateActiveTangible(hardwareId, info);
}

/**
 * Handle tangible remove event
 */
function handleTangibleRemove(hardwareId: string): void {

  // Remove from TUIO store
  useTuioStore.getState().removeActiveTangible(hardwareId);

  // Find matching tangible configuration
  const tangibles = useGraphStore.getState().tangibles;
  const tangibleConfig = tangibles.find((t) => t.hardwareId === hardwareId);

  if (!tangibleConfig) {
    return;
  }


  // Handle removal based on tangible mode
  if (tangibleConfig.mode === 'filter') {
    removeFilterTangible();
  } else if (tangibleConfig.mode === 'state' || tangibleConfig.mode === 'stateDial') {
    removeStateTangible(hardwareId);
  }
}

/**
 * Recalculate and update presentation mode filters based on all active filter tangibles.
 * This combines filters from all active tangibles (union/OR across tangibles).
 * The combineMode of individual tangibles is preserved for filtering logic.
 */
function updatePresentationFilters(): void {
  const activeTangibles = useTuioStore.getState().activeTangibles;
  const allTangibles = useGraphStore.getState().tangibles;

  // Collect all filters from active filter tangibles
  const allLabels = new Set<string>();
  const allActorTypes = new Set<string>();
  const allRelationTypes = new Set<string>();
  let combinedMode: 'AND' | 'OR' = 'OR'; // Default to OR

  activeTangibles.forEach((_, hwId) => {
    const config = allTangibles.find(
      (t) => t.hardwareId === hwId && t.mode === 'filter'
    );
    if (config) {
      // Apply migration to ensure we have filters
      const migratedConfig = migrateTangibleConfig(config);
      const filters = migratedConfig.filters;

      if (filters) {
        // Collect all filter IDs (union across tangibles)
        filters.labels?.forEach((id) => allLabels.add(id));
        filters.actorTypes?.forEach((id) => allActorTypes.add(id));
        filters.relationTypes?.forEach((id) => allRelationTypes.add(id));

        // Use the combine mode from the first tangible (or could be configurable)
        // For multiple tangibles, we use OR between tangibles, but preserve individual combine modes
        if (filters.combineMode) {
          combinedMode = filters.combineMode;
        }
      }
    }
  });

  // Update presentation filters in tuioStore
  useTuioStore.getState().setPresentationFilters({
    labels: Array.from(allLabels),
    actorTypes: Array.from(allActorTypes),
    relationTypes: Array.from(allRelationTypes),
    combineMode: combinedMode,
  });
}

/**
 * Apply filter tangible - recalculate presentation filters
 */
function applyFilterTangible(): void {
  updatePresentationFilters();
}

/**
 * Remove filter tangible - recalculate presentation filters
 */
function removeFilterTangible(): void {
  updatePresentationFilters();
}

/**
 * Apply state tangible - switch to its configured state
 */
function applyStateTangible(tangible: TangibleConfig, hardwareId: string): void {
  if (!tangible.stateId) {
    return;
  }


  // Add to active state tangibles list (at the end)
  useTuioStore.getState().addActiveStateTangible(hardwareId);

  // Always switch to this tangible's state (last added wins)
  // Pass fromTangible=true to prevent clearing the active state tangibles list
  useTimelineStore.getState().switchToState(tangible.stateId, true);

}

/**
 * Remove state tangible - switch to next active state tangible if any
 */
function removeStateTangible(hardwareId: string): void {

  // Remove from active state tangibles list
  useTuioStore.getState().removeActiveStateTangible(hardwareId);

  const activeStateTangibles = useTuioStore.getState().activeStateTangibles;

  // If there are other state tangibles still active, switch to the last one
  if (activeStateTangibles.length > 0) {
    const lastActiveHwId = activeStateTangibles[activeStateTangibles.length - 1];

    // Find the tangible config for this hardware ID
    const tangibles = useGraphStore.getState().tangibles;
    const tangibleConfig = tangibles.find((t) => t.hardwareId === lastActiveHwId);

    if (tangibleConfig && tangibleConfig.stateId) {
      // Pass fromTangible=true to prevent clearing the active state tangibles list
      useTimelineStore.getState().switchToState(tangibleConfig.stateId, true);
    }
  }
  // If no active state tangibles remain, stay in current state
}
