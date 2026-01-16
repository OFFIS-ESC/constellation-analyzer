/**
 * TUIO protocol type definitions
 *
 * @see https://www.tuio.org/
 */

/**
 * Information about a detected TUIO tangible object
 */
export interface TuioTangibleInfo {
  /** Hardware ID of the tangible (TUIO symbol ID) */
  hardwareId: string;
  /** X position (normalized 0-1) */
  x: number;
  /** Y position (normalized 0-1) */
  y: number;
  /** Rotation angle in radians */
  angle: number;
  /** Timestamp of last update */
  lastUpdated: number;
}

/**
 * Callbacks for TUIO client events
 */
export interface TuioClientCallbacks {
  /** Called when a tangible is added to the surface */
  onTangibleAdd: (hardwareId: string, info: TuioTangibleInfo) => void;
  /** Called when a tangible is updated (position/rotation changed) */
  onTangibleUpdate: (hardwareId: string, info: TuioTangibleInfo) => void;
  /** Called when a tangible is removed from the surface */
  onTangibleRemove: (hardwareId: string) => void;
  /** Called when connection state changes */
  onConnectionChange: (connected: boolean, error?: string) => void;
}
