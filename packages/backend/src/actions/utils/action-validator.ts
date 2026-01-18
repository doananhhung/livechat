import { ActionDefinition, ActionFieldType } from "@live-chat/shared-types";

export function validateActionData(
  definition: ActionDefinition,
  data: Record<string, any>
): boolean {
  // 1. Check for unknown fields (Strict Mode)
  const allowedKeys = new Set(definition.fields.map((f) => f.key));
  const dataKeys = Object.keys(data);
  for (const key of dataKeys) {
    if (!allowedKeys.has(key)) {
      return false; // Unknown field found
    }
  }

  // 2. Check each field definition
  for (const field of definition.fields) {
    const value = data[field.key];

    // Check required
    if (field.required && (value === undefined || value === null || value === "")) {
      return false;
    }

    // Skip type check if optional and missing
    if (!field.required && (value === undefined || value === null || value === "")) {
      continue;
    }

    // Check types
    switch (field.type) {
      case ActionFieldType.TEXT:
        if (typeof value !== "string") return false;
        break;
      case ActionFieldType.NUMBER:
        if (typeof value !== "number" || isNaN(value)) return false;
        break;
      case ActionFieldType.BOOLEAN:
        if (typeof value !== "boolean") return false;
        break;
      case ActionFieldType.DATE:
        // Accept valid date string or Date object
        if (
            !(value instanceof Date) && 
            (typeof value !== "string" || isNaN(Date.parse(value)))
        ) {
            return false;
        }
        break;
      case ActionFieldType.SELECT:
        if (typeof value !== "string") return false;
        if (field.options && !field.options.includes(value)) return false;
        break;
      default:
        return false;
    }
  }

  return true;
}
