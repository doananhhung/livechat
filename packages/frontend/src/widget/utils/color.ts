/**
 * Converts a hex color string to an RGB object.
 * @param hex The hex color string (e.g., "#RRGGBB").
 * @returns An object with r, g, b properties, or null if invalid.
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Determines if a hex color is "light" or "dark" based on luminance.
 * @param hexColor The hex color string.
 * @returns True if the color is light, false if it's dark.
 */
export const isColorLight = (hexColor?: string): boolean => {
  if (!hexColor) {
    return true; // Default to light theme for default white background
  }

  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return true; // Default to light on invalid color
  }

  // Using the YIQ formula to determine perceived brightness
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5;
};
