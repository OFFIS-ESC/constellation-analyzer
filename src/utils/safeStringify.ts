/**
 * Safe JSON stringification utilities
 *
 * Prevents serialization of dangerous properties like __proto__, constructor, and prototype
 * to avoid prototype pollution attacks and unnecessary data in localStorage.
 */

// List of dangerous property names to exclude from serialization
const DANGEROUS_PROPS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Replacer function for JSON.stringify that filters out dangerous properties
 * @param key - Property key
 * @param value - Property value
 * @returns The value to serialize, or undefined to omit the property
 */
export function safeReplacer(key: string, value: unknown): unknown {
  // Skip dangerous properties
  if (DANGEROUS_PROPS.has(key)) {
    return undefined;
  }
  return value;
}

/**
 * Safe JSON.stringify that excludes dangerous properties
 * @param value - Value to stringify
 * @param space - Optional formatting (spaces/tabs)
 * @returns JSON string
 */
export function safeStringify(value: unknown, space?: string | number): string {
  return JSON.stringify(value, safeReplacer, space);
}

/**
 * Deep clean an object by removing dangerous properties
 * This mutates the object in place and also returns it for chaining
 * @param obj - Object to clean
 * @returns The cleaned object
 */
export function deepCleanObject<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    obj.forEach((item) => deepCleanObject(item));
    return obj;
  }

  // Handle objects
  const objRecord = obj as Record<string, unknown>;

  // Remove dangerous properties
  DANGEROUS_PROPS.forEach((prop) => {
    if (prop in objRecord) {
      delete objRecord[prop];
    }
  });

  // Recursively clean nested objects
  Object.values(objRecord).forEach((value) => {
    if (value && typeof value === 'object') {
      deepCleanObject(value);
    }
  });

  return obj;
}

/**
 * Parse JSON and clean the result
 * @param json - JSON string to parse
 * @returns Parsed and cleaned object
 */
export function safeParse<T = unknown>(json: string): T {
  const parsed = JSON.parse(json) as T;
  return deepCleanObject(parsed);
}
