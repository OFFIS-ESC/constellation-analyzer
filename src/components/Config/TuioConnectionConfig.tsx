import { useState, useEffect, useRef } from 'react';
import { useTuioStore } from '../../stores/tuioStore';
import { useGraphStore } from '../../stores/graphStore';
import { useToastStore } from '../../stores/toastStore';
import { TuioClientManager } from '../../lib/tuio/tuioClient';
import type { TuioTangibleInfo } from '../../lib/tuio/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TuioConnectionConfig = ({ isOpen, onClose }: Props) => {
  const { websocketUrl, setWebsocketUrl, protocolVersion, setProtocolVersion } = useTuioStore();
  const { tangibles } = useGraphStore();
  const { showToast } = useToastStore();

  const [urlInput, setUrlInput] = useState(websocketUrl);
  const [versionInput, setVersionInput] = useState<'1.1' | '2.0'>(protocolVersion);
  const [testConnected, setTestConnected] = useState(false);
  const [testConnectionError, setTestConnectionError] = useState<string | null>(null);
  const [testActiveTangibles, setTestActiveTangibles] = useState<Map<string, TuioTangibleInfo>>(
    new Map()
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const testClientRef = useRef<TuioClientManager | null>(null);

  // Sync inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setUrlInput(websocketUrl);
      setVersionInput(protocolVersion);
      setTestConnected(false);
      setTestConnectionError(null);
      setTestActiveTangibles(new Map());
    }
  }, [isOpen, websocketUrl, protocolVersion]);

  // Cleanup test connection when modal closes
  useEffect(() => {
    if (!isOpen && testClientRef.current) {
      testClientRef.current.disconnect();
      testClientRef.current = null;
      setTestConnected(false);
      setTestActiveTangibles(new Map());
    }
  }, [isOpen]);

  const handleConnect = async () => {
    // Validate URL first
    if (!urlInput.trim()) {
      showToast('WebSocket URL is required', 'error');
      return;
    }

    try {
      const url = new URL(urlInput);
      if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
        showToast('URL must start with ws:// or wss://', 'error');
        return;
      }
    } catch {
      showToast('Invalid WebSocket URL format', 'error');
      return;
    }

    setIsConnecting(true);
    setTestConnectionError(null);

    try {
      // Create test client
      const client = new TuioClientManager(
        {
          onTangibleAdd: (hardwareId: string, info: TuioTangibleInfo) => {
          console.log('[TUIO Config] Tangible added callback:', hardwareId, info);
          setTestActiveTangibles((prev) => {
            const newMap = new Map(prev);
            newMap.set(hardwareId, info);
            console.log('[TUIO Config] Active tangibles count:', newMap.size);
            return newMap;
          });
        },
        onTangibleUpdate: (hardwareId: string, info: TuioTangibleInfo) => {
          console.log('[TUIO Config] Tangible updated callback:', hardwareId, info);
          setTestActiveTangibles((prev) => {
            const newMap = new Map(prev);
            if (newMap.has(hardwareId)) {
              newMap.set(hardwareId, info);
            }
            return newMap;
          });
        },
        onTangibleRemove: (hardwareId: string) => {
          console.log('[TUIO Config] Tangible removed callback:', hardwareId);
          setTestActiveTangibles((prev) => {
            const newMap = new Map(prev);
            newMap.delete(hardwareId);
            console.log('[TUIO Config] Active tangibles count:', newMap.size);
            return newMap;
          });
        },
        onConnectionChange: (connected: boolean, error?: string) => {
          console.log('[TUIO Config] Connection state changed:', connected, error);
          setTestConnected(connected);
          if (error) {
            setTestConnectionError(error);
            showToast(`Connection failed: ${error}`, 'error');
          }
        },
      },
      versionInput
      );

      testClientRef.current = client;
      await client.connect(urlInput);
    } catch (error) {
      // Error already handled by onConnectionChange callback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestConnectionError(errorMessage);
      setTestConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (testClientRef.current) {
      testClientRef.current.disconnect();
      testClientRef.current = null;
    }
    setTestConnected(false);
    setTestConnectionError(null);
    setTestActiveTangibles(new Map());
    showToast('Disconnected from TUIO server', 'info');
  };

  const handleSave = () => {
    // Disconnect test connection before saving
    if (testClientRef.current) {
      testClientRef.current.disconnect();
      testClientRef.current = null;
      setTestConnected(false);
      setTestActiveTangibles(new Map());
    }

    // Validate WebSocket URL format
    if (!urlInput.trim()) {
      showToast('WebSocket URL is required', 'error');
      return;
    }

    try {
      const url = new URL(urlInput);
      if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
        showToast('URL must start with ws:// or wss://', 'error');
        return;
      }
    } catch {
      showToast('Invalid WebSocket URL format', 'error');
      return;
    }

    // Save URL and protocol version
    setWebsocketUrl(urlInput);
    setProtocolVersion(versionInput);
    onClose();
  };

  const handleCancel = () => {
    // Disconnect test connection before closing
    if (testClientRef.current) {
      testClientRef.current.disconnect();
      testClientRef.current = null;
      setTestConnected(false);
      setTestActiveTangibles(new Map());
    }
    onClose();
  };

  const handleReset = () => {
    setUrlInput('ws://localhost:3333');
  };

  if (!isOpen) return null;

  // Get all detected tangibles with their config status
  const detectedTangibles = Array.from(testActiveTangibles.entries()).map(([hwId, info]) => {
    const config = tangibles.find((t) => t.hardwareId === hwId);
    return {
      hardwareId: hwId,
      info,
      config,
      isConfigured: config !== undefined,
    };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">TUIO Connection Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure connection to TUIO server for tangible detection
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* WebSocket URL */}
          <div className="mb-6">
            <label htmlFor="websocket-url" className="block text-sm font-medium text-gray-700 mb-2">
              WebSocket URL
            </label>
            <div className="flex gap-2">
              <input
                id="websocket-url"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="ws://localhost:3333"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Reset
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Example: ws://localhost:3333 or ws://192.168.1.100:3333
            </p>
          </div>

          {/* Protocol Version */}
          <div className="mb-6">
            <label htmlFor="protocol-version" className="block text-sm font-medium text-gray-700 mb-2">
              TUIO Protocol Version
            </label>
            <select
              id="protocol-version"
              value={versionInput}
              onChange={(e) => setVersionInput(e.target.value as '1.1' | '2.0')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="2.0">TUIO 2.0 (Default)</option>
              <option value="1.1">TUIO 1.1</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the TUIO protocol version used by your server. Most modern systems use TUIO 2.0.
            </p>
          </div>

          {/* Test Connection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Connection
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-md">
                <div
                  className={`w-3 h-3 rounded-full ${
                    testConnected ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium">
                  {testConnected ? 'Connected' : 'Disconnected'}
                </span>
                {testConnectionError && (
                  <span className="text-sm text-red-600 ml-2">
                    ({testConnectionError})
                  </span>
                )}
              </div>
              {!testConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Test the connection to verify your TUIO server is reachable and detect tangibles.
            </p>
          </div>

          {/* Active Tangibles */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Tangibles
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({testActiveTangibles.size} detected)
              </span>
            </label>
            <div className="border border-gray-200 rounded-md divide-y divide-gray-200 min-h-[100px]">
              {detectedTangibles.length > 0 ? (
                detectedTangibles.map((tangible) => (
                  <div
                    key={tangible.hardwareId}
                    className={`px-4 py-3 ${tangible.isConfigured ? 'bg-green-50' : 'bg-yellow-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {tangible.config?.name || `Hardware ID: ${tangible.hardwareId}`}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              tangible.isConfigured
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {tangible.isConfigured ? 'Configured' : 'Not Configured'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Hardware ID: {tangible.hardwareId}
                          {tangible.config && ` • Mode: ${tangible.config.mode}`}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        <div>Position: ({tangible.info.x.toFixed(2)}, {tangible.info.y.toFixed(2)})</div>
                        <div>Angle: {(tangible.info.angle * 180 / Math.PI).toFixed(1)}°</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  {testConnected
                    ? 'No tangibles detected. Place a tangible on the TUIO surface.'
                    : 'Connect to TUIO server to detect tangibles.'}
                </div>
              )}
            </div>
            {detectedTangibles.some((t) => !t.isConfigured) && (
              <p className="text-xs text-yellow-700 mt-2 flex items-start gap-1">
                <span className="font-bold">⚠️</span>
                <span>
                  Some detected tangibles are not configured. Go to Tangible Configuration to set up hardware IDs.
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TuioConnectionConfig;
