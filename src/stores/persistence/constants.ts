/**
 * Persistence Constants
 *
 * Storage keys, configuration, and version information for local storage persistence
 */

// Storage keys for localStorage
export const STORAGE_KEYS = {
  GRAPH_STATE: 'constellation:graph:v1',
  EDITOR_SETTINGS: 'constellation:editor:v1',
  AUTOSAVE_FLAG: 'constellation:autosave',
  LAST_SAVED: 'constellation:lastSaved',
} as const;

// Debounce configuration for auto-save
export const DEBOUNCE_CONFIG = {
  DELAY: 1000,              // 1 second after last change
  MAX_WAIT: 5000,           // Force save every 5 seconds
  THROTTLE_NODE_DRAG: 500,  // Faster saves during drag operations
} as const;

// Current schema version
export const SCHEMA_VERSION = '1.0.0';

// Application identifier
export const APP_NAME = 'constellation-analyzer';
