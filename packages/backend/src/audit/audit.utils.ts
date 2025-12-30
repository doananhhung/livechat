import { JsonValue } from "@live-chat/shared-types";

/**
 * Recursively scrubs sensitive keys from an object, replacing their values with '[REDACTED]'.
 * This function handles objects and arrays, ensuring deep sanitization.
 *
 * @param data The object or array to sanitize.
 * @param sensitiveKeys A set of strings representing keys whose values should be redacted.
 * @returns A new object or array with sensitive values redacted.
 */
export function sanitizeMetadata(
  data: JsonValue | Record<string, JsonValue> | Array<JsonValue>,
  sensitiveKeys: Set<string>
): JsonValue | Record<string, JsonValue> | Array<JsonValue> {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeMetadata(item, sensitiveKeys)) as Array<JsonValue>;
  }

  const sanitizedData: Record<string, JsonValue> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (sensitiveKeys.has(key.toLowerCase())) { // Case-insensitive check
        sanitizedData[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitizedData[key] = sanitizeMetadata(value, sensitiveKeys);
      } else {
        sanitizedData[key] = value;
      }
    }
  }
  return sanitizedData;
}

export const DEFAULT_SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'creditcard',
  'cvv',
  'ssn',
  'apikey',
]);
