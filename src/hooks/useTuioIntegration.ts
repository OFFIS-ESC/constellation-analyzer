import { useEffect, useRef } from 'react';
import { useTuioStore } from '../stores/tuioStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGraphStore } from '../stores/graphStore';
import { useSearchStore } from '../stores/searchStore';
import { useTimelineStore } from '../stores/timelineStore';
import { TuioClientManager } from '../lib/tuio/tuioClient';
import type { TuioTangibleInfo } from '../lib/tuio/types';
import type { TangibleConfig } from '../types';

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
        console.log('[TUIO Integration] Presentation mode disabled, disconnecting');
        clientRef.current.disconnect();
        clientRef.current = null;
        useTuioStore.getState().clearActiveTangibles();
      }
      return;
    }

    console.log('[TUIO Integration] Presentation mode enabled, connecting to TUIO server');

    // Create TUIO client if in presentation mode
    const client = new TuioClientManager(
      {
        onTangibleAdd: handleTangibleAdd,
        onTangibleUpdate: handleTangibleUpdate,
        onTangibleRemove: handleTangibleRemove,
        onConnectionChange: (connected, error) => {
          console.log('[TUIO Integration] Connection state changed:', connected, error);
          useTuioStore.getState().setConnectionState(connected, error);
        },
      },
      protocolVersion
    );

    clientRef.current = client;

    // Connect to TUIO server
    client
      .connect(websocketUrl)
      .catch((error) => {
        console.error('[TUIO Integration] Failed to connect to TUIO server:', error);
      });

    // Cleanup on unmount or when presentation mode changes
    return () => {
      if (clientRef.current) {
        console.log('[TUIO Integration] Cleaning up, disconnecting');
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
  console.log('[TUIO Integration] Tangible added:', hardwareId, info);

  // Update TUIO store
  useTuioStore.getState().addActiveTangible(hardwareId, info);

  // Find matching tangible configuration
  const tangibles = useGraphStore.getState().tangibles;
  const tangibleConfig = tangibles.find((t) => t.hardwareId === hardwareId);

  if (!tangibleConfig) {
    // Unknown hardware ID - silently ignore
    console.log('[TUIO Integration] No configuration found for hardware ID:', hardwareId);
    return;
  }

  console.log('[TUIO Integration] Tangible configuration found:', tangibleConfig.name, 'mode:', tangibleConfig.mode);

  // Trigger action based on tangible mode
  if (tangibleConfig.mode === 'filter') {
    applyFilterTangible(tangibleConfig);
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
  console.log('[TUIO Integration] Tangible updated:', hardwareId, info);
  useTuioStore.getState().updateActiveTangible(hardwareId, info);
}

/**
 * Handle tangible remove event
 */
function handleTangibleRemove(hardwareId: string): void {
  console.log('[TUIO Integration] Tangible removed:', hardwareId);

  // Remove from TUIO store
  useTuioStore.getState().removeActiveTangible(hardwareId);

  // Find matching tangible configuration
  const tangibles = useGraphStore.getState().tangibles;
  const tangibleConfig = tangibles.find((t) => t.hardwareId === hardwareId);

  if (!tangibleConfig) {
    console.log('[TUIO Integration] No configuration found for removed tangible:', hardwareId);
    return;
  }

  console.log('[TUIO Integration] Handling removal for configured tangible:', tangibleConfig.name);

  // Handle removal based on tangible mode
  if (tangibleConfig.mode === 'filter') {
    removeFilterTangible(tangibleConfig);
  } else if (tangibleConfig.mode === 'state' || tangibleConfig.mode === 'stateDial') {
    removeStateTangible(hardwareId);
  }
}

/**
 * Apply filter tangible - add its labels to selected labels
 */
function applyFilterTangible(tangible: TangibleConfig): void {
  if (!tangible.filterLabels || tangible.filterLabels.length === 0) {
    return;
  }

  const { selectedLabels, toggleSelectedLabel } = useSearchStore.getState();

  // Add labels that aren't already selected
  tangible.filterLabels.forEach((labelId) => {
    if (!selectedLabels.includes(labelId)) {
      toggleSelectedLabel(labelId);
    }
  });
}

/**
 * Remove filter tangible - remove its labels if no other active tangible uses them
 */
function removeFilterTangible(tangible: TangibleConfig): void {
  if (!tangible.filterLabels || tangible.filterLabels.length === 0) {
    return;
  }

  // Get all remaining active filter tangibles
  const activeTangibles = useTuioStore.getState().activeTangibles;
  const allTangibles = useGraphStore.getState().tangibles;

  // Build set of labels still in use by other active filter tangibles
  const labelsStillActive = new Set<string>();
  activeTangibles.forEach((_, hwId) => {
    const config = allTangibles.find(
      (t) => t.hardwareId === hwId && t.mode === 'filter'
    );
    if (config && config.filterLabels) {
      config.filterLabels.forEach((labelId) => labelsStillActive.add(labelId));
    }
  });

  // Remove labels that are no longer active
  const { selectedLabels, toggleSelectedLabel } = useSearchStore.getState();

  tangible.filterLabels.forEach((labelId) => {
    if (selectedLabels.includes(labelId) && !labelsStillActive.has(labelId)) {
      toggleSelectedLabel(labelId);
    }
  });
}

/**
 * Apply state tangible - switch to its configured state
 */
function applyStateTangible(tangible: TangibleConfig, hardwareId: string): void {
  if (!tangible.stateId) {
    return;
  }

  console.log('[TUIO Integration] Applying state tangible:', hardwareId, 'stateId:', tangible.stateId);

  // Add to active state tangibles list (at the end)
  useTuioStore.getState().addActiveStateTangible(hardwareId);

  // Always switch to this tangible's state (last added wins)
  // Pass fromTangible=true to prevent clearing the active state tangibles list
  useTimelineStore.getState().switchToState(tangible.stateId, true);

  console.log('[TUIO Integration] Active state tangibles:', useTuioStore.getState().activeStateTangibles);
}

/**
 * Remove state tangible - switch to next active state tangible if any
 */
function removeStateTangible(hardwareId: string): void {
  console.log('[TUIO Integration] Removing state tangible:', hardwareId);

  // Remove from active state tangibles list
  useTuioStore.getState().removeActiveStateTangible(hardwareId);

  const activeStateTangibles = useTuioStore.getState().activeStateTangibles;
  console.log('[TUIO Integration] Remaining active state tangibles:', activeStateTangibles);

  // If there are other state tangibles still active, switch to the last one
  if (activeStateTangibles.length > 0) {
    const lastActiveHwId = activeStateTangibles[activeStateTangibles.length - 1];
    console.log('[TUIO Integration] Switching to last active state tangible:', lastActiveHwId);

    // Find the tangible config for this hardware ID
    const tangibles = useGraphStore.getState().tangibles;
    const tangibleConfig = tangibles.find((t) => t.hardwareId === lastActiveHwId);

    if (tangibleConfig && tangibleConfig.stateId) {
      // Pass fromTangible=true to prevent clearing the active state tangibles list
      useTimelineStore.getState().switchToState(tangibleConfig.stateId, true);
    }
  } else {
    console.log('[TUIO Integration] No more active state tangibles, staying in current state');
  }
}
