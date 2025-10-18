/**
 * Storage Cleanup Utility
 *
 * Removes dangerous __proto__ properties from existing localStorage data
 */

import { safeParse, safeStringify } from './safeStringify';
import { WORKSPACE_STORAGE_KEYS } from '../stores/workspace/persistence';

/**
 * Clean all workspace data in localStorage
 * This will re-save all data without __proto__ properties
 */
export function cleanupAllStorage(): { cleaned: number; errors: number } {
  let cleaned = 0;
  let errors = 0;

  console.log('[Storage Cleanup] Starting cleanup of localStorage...');

  try {
    // Get all keys that need cleaning
    const keysToClean: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key === WORKSPACE_STORAGE_KEYS.WORKSPACE_STATE ||
        key === WORKSPACE_STORAGE_KEYS.WORKSPACE_SETTINGS ||
        key.startsWith(WORKSPACE_STORAGE_KEYS.DOCUMENT_PREFIX) ||
        key.startsWith(WORKSPACE_STORAGE_KEYS.DOCUMENT_METADATA_PREFIX) ||
        key === WORKSPACE_STORAGE_KEYS.LEGACY_GRAPH_STATE
      )) {
        keysToClean.push(key);
      }
    }

    console.log(`[Storage Cleanup] Found ${keysToClean.length} items to check`);

    // Clean each key
    for (const key of keysToClean) {
      try {
        const json = localStorage.getItem(key);
        if (!json) continue;

        // Check if it contains __proto__
        if (json.includes('"__proto__"')) {
          console.log(`[Storage Cleanup] Cleaning ${key}...`);

          // Parse and clean the data
          const cleaned_data = safeParse(json);

          // Re-save with clean data
          localStorage.setItem(key, safeStringify(cleaned_data));

          cleaned++;
          console.log(`[Storage Cleanup] ✓ Cleaned ${key}`);
        }
      } catch (error) {
        console.error(`[Storage Cleanup] ✗ Error cleaning ${key}:`, error);
        errors++;
      }
    }

    console.log(`[Storage Cleanup] Complete! Cleaned ${cleaned} items, ${errors} errors`);
  } catch (error) {
    console.error('[Storage Cleanup] Fatal error during cleanup:', error);
    errors++;
  }

  return { cleaned, errors };
}

/**
 * Check if storage needs cleanup (contains __proto__)
 */
export function needsStorageCleanup(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key === WORKSPACE_STORAGE_KEYS.WORKSPACE_STATE ||
        key === WORKSPACE_STORAGE_KEYS.WORKSPACE_SETTINGS ||
        key.startsWith(WORKSPACE_STORAGE_KEYS.DOCUMENT_PREFIX) ||
        key.startsWith(WORKSPACE_STORAGE_KEYS.DOCUMENT_METADATA_PREFIX) ||
        key === WORKSPACE_STORAGE_KEYS.LEGACY_GRAPH_STATE
      )) {
        const json = localStorage.getItem(key);
        if (json && json.includes('"__proto__"')) {
          return true;
        }
      }
    }
  } catch (error) {
    console.error('[Storage Cleanup] Error checking for cleanup:', error);
  }

  return false;
}
