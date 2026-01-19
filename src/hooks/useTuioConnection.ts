import { useEffect, useRef } from 'react';
import { useTuioStore } from '../stores/tuioStore';
import { TuioClientManager } from '../lib/tuio/tuioClient';
import type { TuioTangibleInfo } from '../lib/tuio/types';

/**
 * Hook to manage TUIO client connection lifecycle
 *
 * @param shouldConnect - Whether to connect to TUIO server
 * @param onTangibleAdd - Optional callback when tangible is added
 * @param onTangibleUpdate - Optional callback when tangible is updated
 * @param onTangibleRemove - Optional callback when tangible is removed
 */
export function useTuioConnection(
  shouldConnect: boolean,
  callbacks?: {
    onTangibleAdd?: (hardwareId: string, info: TuioTangibleInfo) => void;
    onTangibleUpdate?: (hardwareId: string, info: TuioTangibleInfo) => void;
    onTangibleRemove?: (hardwareId: string) => void;
  }
) {
  const clientRef = useRef<TuioClientManager | null>(null);
  const { websocketUrl, protocolVersion } = useTuioStore();

  useEffect(() => {
    if (!shouldConnect) {
      // Disconnect if we should not be connected
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
        useTuioStore.getState().clearActiveTangibles();
      }
      return;
    }

    // Create TUIO client
    const client = new TuioClientManager(
      {
        onTangibleAdd: (hardwareId: string, info: TuioTangibleInfo) => {
          useTuioStore.getState().addActiveTangible(hardwareId, info);
          callbacks?.onTangibleAdd?.(hardwareId, info);
        },
        onTangibleUpdate: (hardwareId: string, info: TuioTangibleInfo) => {
          useTuioStore.getState().updateActiveTangible(hardwareId, info);
          callbacks?.onTangibleUpdate?.(hardwareId, info);
        },
        onTangibleRemove: (hardwareId: string) => {
          useTuioStore.getState().removeActiveTangible(hardwareId);
          callbacks?.onTangibleRemove?.(hardwareId);
        },
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

    // Cleanup on unmount or when shouldConnect changes
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
        useTuioStore.getState().clearActiveTangibles();
      }
    };
  }, [shouldConnect, websocketUrl, protocolVersion, callbacks]);
}
