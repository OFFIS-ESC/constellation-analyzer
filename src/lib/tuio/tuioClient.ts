import {
  Tuio11Client,
  Tuio11Object,
  Tuio11Listener,
  Tuio20Client,
  Tuio20Object,
  Tuio20Listener
} from 'tuio-client';
import { WebsocketTuioReceiver } from './WebsocketTuioReceiver';
import type { TuioClientCallbacks, TuioTangibleInfo } from './types';

export type TuioProtocolVersion = '1.1' | '2.0';

/**
 * TUIO Client Manager
 * Wraps both TUIO 1.1 and TUIO 2.0 clients and provides a simplified interface for tangible detection
 */
export class TuioClientManager implements Tuio11Listener, Tuio20Listener {
  private client11: Tuio11Client | null = null;
  private client20: Tuio20Client | null = null;
  private receiver: WebsocketTuioReceiver | null = null;
  private callbacks: TuioClientCallbacks;
  private url: string = '';
  private protocolVersion: TuioProtocolVersion;

  constructor(callbacks: TuioClientCallbacks, protocolVersion: TuioProtocolVersion = '2.0') {
    this.callbacks = callbacks;
    this.protocolVersion = protocolVersion;
  }

  /**
   * Connect to TUIO server via WebSocket
   * @param url WebSocket URL (e.g., 'ws://localhost:3333')
   */
  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[TUIO] Connecting to ${url} with protocol version ${this.protocolVersion}`);

        // Parse WebSocket URL
        const wsUrl = new URL(url);
        const host = wsUrl.hostname;
        const port = parseInt(wsUrl.port) || 3333;

        this.url = url;

        // Create receiver
        this.receiver = new WebsocketTuioReceiver(host, port);

        // Create appropriate client based on protocol version
        if (this.protocolVersion === '1.1') {
          console.log('[TUIO] Creating TUIO 1.1 client');
          this.client11 = new Tuio11Client(this.receiver);
          this.client20 = null;
        } else {
          console.log('[TUIO] Creating TUIO 2.0 client');
          this.client20 = new Tuio20Client(this.receiver);
          this.client11 = null;
        }

        // Set up connection event handlers
        this.receiver.setOnOpen(() => {
          // Connection successful
          console.log('[TUIO] Connection successful');
          this.callbacks.onConnectionChange(true);
          resolve();
        });

        this.receiver.setOnError((error: string) => {
          // Connection error
          console.error('TUIO connection error:', error);
          this.callbacks.onConnectionChange(false, error);
          reject(new Error(error));
        });

        this.receiver.setOnClose((error?: string) => {
          // Connection closed
          if (error) {
            console.error('TUIO connection closed with error:', error);
            this.callbacks.onConnectionChange(false, error);
          } else {
            this.callbacks.onConnectionChange(false);
          }
        });

        // Add this manager as a listener
        if (this.client11) {
          console.log('[TUIO] Adding listener to TUIO 1.1 client');
          this.client11.addTuioListener(this);
          console.log('[TUIO] Connecting TUIO 1.1 client');
          this.client11.connect();
        } else if (this.client20) {
          console.log('[TUIO] Adding listener to TUIO 2.0 client');
          this.client20.addTuioListener(this);
          console.log('[TUIO] Connecting TUIO 2.0 client');
          this.client20.connect();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('TUIO connection error:', errorMessage);
        this.callbacks.onConnectionChange(false, errorMessage);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from TUIO server
   */
  disconnect(): void {
    if (this.client11) {
      this.client11.removeTuioListener(this);
      this.client11.disconnect();
      this.client11 = null;
    }

    if (this.client20) {
      this.client20.removeTuioListener(this);
      this.client20.disconnect();
      this.client20 = null;
    }

    if (this.receiver) {
      this.receiver.disconnect();
      this.receiver = null;
    }

    this.callbacks.onConnectionChange(false);
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return (this.client11 !== null || this.client20 !== null) && this.receiver !== null;
  }

  /**
   * Get current WebSocket URL
   */
  getUrl(): string {
    return this.url;
  }

  // TUIO 1.1 Listener implementation

  /**
   * Called when a TUIO 1.1 object is added (tangible placed on surface)
   */
  addTuioObject(tuioObject: Tuio11Object): void {
    console.log('[TUIO] 1.1 Object added - raw object:', tuioObject);

    // Validate symbolId exists
    if (tuioObject.symbolId === undefined || tuioObject.symbolId === null) {
      console.warn('[TUIO] 1.1 Object has no symbolId, ignoring');
      return;
    }

    const info = this.extractTangibleInfo11(tuioObject);
    console.log('[TUIO] 1.1 Object added - extracted info:', info);
    this.callbacks.onTangibleAdd(info.hardwareId, info);
  }

  /**
   * Called when a TUIO 1.1 object is updated (position/rotation changed)
   */
  updateTuioObject(tuioObject: Tuio11Object): void {
    console.log('[TUIO] 1.1 Object updated - raw object:', tuioObject);

    // Validate symbolId exists
    if (tuioObject.symbolId === undefined || tuioObject.symbolId === null) {
      console.warn('[TUIO] 1.1 Object has no symbolId, ignoring');
      return;
    }

    const info = this.extractTangibleInfo11(tuioObject);
    console.log('[TUIO] 1.1 Object updated - extracted info:', info);
    this.callbacks.onTangibleUpdate(info.hardwareId, info);
  }

  /**
   * Called when a TUIO 1.1 object is removed (tangible removed from surface)
   */
  removeTuioObject(tuioObject: Tuio11Object): void {
    console.log('[TUIO] 1.1 Object removed - raw object:', tuioObject);

    // Validate symbolId exists
    if (tuioObject.symbolId === undefined || tuioObject.symbolId === null) {
      console.warn('[TUIO] 1.1 Object has no symbolId, ignoring');
      return;
    }

    const hardwareId = String(tuioObject.symbolId);
    console.log('[TUIO] 1.1 Object removed - hardwareId:', hardwareId);
    this.callbacks.onTangibleRemove(hardwareId);
  }

  /**
   * Called when a TUIO 1.1 cursor is added (not used for tangibles)
   */
  addTuioCursor(): void {
    console.log('[TUIO] 1.1 Cursor added (ignored)');
    // Ignore cursors (touch points)
  }

  /**
   * Called when a TUIO 1.1 cursor is updated (not used for tangibles)
   */
  updateTuioCursor(): void {
    console.log('[TUIO] 1.1 Cursor updated (ignored)');
    // Ignore cursors
  }

  /**
   * Called when a TUIO 1.1 cursor is removed (not used for tangibles)
   */
  removeTuioCursor(): void {
    console.log('[TUIO] 1.1 Cursor removed (ignored)');
    // Ignore cursors
  }

  /**
   * Called when a TUIO 1.1 blob is added (not used for tangibles)
   */
  addTuioBlob(): void {
    console.log('[TUIO] 1.1 Blob added (ignored)');
    // Ignore blobs
  }

  /**
   * Called when a TUIO 1.1 blob is updated (not used for tangibles)
   */
  updateTuioBlob(): void {
    console.log('[TUIO] 1.1 Blob updated (ignored)');
    // Ignore blobs
  }

  /**
   * Called when a TUIO 1.1 blob is removed (not used for tangibles)
   */
  removeTuioBlob(): void {
    console.log('[TUIO] 1.1 Blob removed (ignored)');
    // Ignore blobs
  }

  /**
   * Called on TUIO 1.1 frame refresh (time sync)
   */
  refresh(): void {
    console.log('[TUIO] 1.1 Frame refresh (ignored)');
    // Ignore refresh events
  }

  // TUIO 2.0 Listener implementation

  /**
   * Called when a TUIO object is added (tangible placed on surface)
   */
  tuioAdd(tuioObject: Tuio20Object): void {
    const token = tuioObject.token;
    if (!token) {
      console.log('[TUIO] 2.0 Add event ignored (not a token)');
      return; // Only handle tokens (tangibles), not pointers
    }

    const info = this.extractTangibleInfo(tuioObject);
    console.log('[TUIO] 2.0 Token added:', info);
    this.callbacks.onTangibleAdd(info.hardwareId, info);
  }

  /**
   * Called when a TUIO object is updated (position/rotation changed)
   */
  tuioUpdate(tuioObject: Tuio20Object): void {
    const token = tuioObject.token;
    if (!token) {
      console.log('[TUIO] 2.0 Update event ignored (not a token)');
      return;
    }

    const info = this.extractTangibleInfo(tuioObject);
    console.log('[TUIO] 2.0 Token updated:', info);
    this.callbacks.onTangibleUpdate(info.hardwareId, info);
  }

  /**
   * Called when a TUIO object is removed (tangible removed from surface)
   */
  tuioRemove(tuioObject: Tuio20Object): void {
    const token = tuioObject.token;
    if (!token) {
      console.log('[TUIO] 2.0 Remove event ignored (not a token)');
      return;
    }

    const hardwareId = String(token.cId);
    console.log('[TUIO] 2.0 Token removed:', hardwareId);
    this.callbacks.onTangibleRemove(hardwareId);
  }

  /**
   * Called on frame refresh (time sync)
   * Not used in this implementation
   */
  tuioRefresh(): void {
    // Ignore refresh events
  }

  /**
   * Extract tangible information from TUIO 2.0 object
   */
  private extractTangibleInfo(tuioObject: Tuio20Object): TuioTangibleInfo {
    const token = tuioObject.token!;

    return {
      hardwareId: String(token.cId), // Component ID is the unique marker ID
      x: token.position.x,
      y: token.position.y,
      angle: token.angle,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Extract tangible information from TUIO 1.1 object
   */
  private extractTangibleInfo11(tuioObject: Tuio11Object): TuioTangibleInfo {
    return {
      hardwareId: String(tuioObject.symbolId), // Symbol ID is the marker ID
      x: tuioObject.position.x,
      y: tuioObject.position.y,
      angle: tuioObject.angle,
      lastUpdated: Date.now(),
    };
  }
}
