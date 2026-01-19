import OSC from 'osc-js';
import { TuioReceiver } from 'tuio-client';

/**
 * OSC Message format (not exported by tuio-client)
 */
interface OscMessage {
  address: string;
  args: (number | string | boolean | Blob | null)[];
}

/**
 * WebSocket-based TUIO receiver
 * Connects to a TUIO server via WebSocket and forwards OSC messages to the TUIO client
 */
export class WebsocketTuioReceiver extends TuioReceiver {
  private osc: OSC;
  private onOpenCallback?: () => void;
  private onCloseCallback?: (error?: string) => void;
  private onErrorCallback?: (error: string) => void;

  constructor(host: string, port: number) {
    super();

    console.log(`[TUIO] Creating WebSocket receiver for ${host}:${port}`);

    // Create OSC WebSocket client
    this.osc = new OSC({
      plugin: new OSC.WebsocketClientPlugin({
        host,
        port,
      }),
    });

    // Forward all OSC messages to TUIO client
    this.osc.on('*', (message: OscMessage) => {
      console.log('[TUIO] OSC message received:', message.address, message.args);
      this.onOscMessage(message);
    });

    // Listen for WebSocket connection events
    this.osc.on('open', () => {
      console.log('[TUIO] WebSocket connection opened');
      if (this.onOpenCallback) {
        this.onOpenCallback();
      }
    });

    this.osc.on('close', () => {
      console.log('[TUIO] WebSocket connection closed');
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    });

    this.osc.on('error', (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'WebSocket error';
      console.error('[TUIO] WebSocket error:', errorMessage);
      if (this.onErrorCallback) {
        this.onErrorCallback(errorMessage);
      }
    });
  }

  /**
   * Set callback for connection open event
   */
  setOnOpen(callback: () => void): void {
    this.onOpenCallback = callback;
  }

  /**
   * Set callback for connection close event
   */
  setOnClose(callback: (error?: string) => void): void {
    this.onCloseCallback = callback;
  }

  /**
   * Set callback for connection error event
   */
  setOnError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Open WebSocket connection to TUIO server
   */
  connect(): void {
    console.log('[TUIO] Opening WebSocket connection...');
    this.osc.open();
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    console.log('[TUIO] Closing WebSocket connection...');
    this.osc.close();
  }
}
