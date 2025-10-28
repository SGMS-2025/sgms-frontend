/**
 * Safely parse JSON string without throwing errors
 * @param jsonString - The JSON string to parse
 * @param defaultValue - Default value to return if parsing fails
 * @returns Parsed object or default value
 */
export const safeJsonParse = <T = unknown>(
  jsonString: string | null | undefined,
  defaultValue: T | null = null
): T | null => {
  if (!jsonString || typeof jsonString !== 'string') {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
};

/**
 * Type for objects that can be safely stringified
 */
type SerializableObject = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

/**
 * Safely stringify object to JSON
 * @param obj - Object to stringify
 * @param defaultValue - Default value to return if stringify fails
 * @returns JSON string or default value
 */
export const safeJsonStringify = (obj: SerializableObject, defaultValue: string = '{}'): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
};
