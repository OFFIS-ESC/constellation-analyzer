/**
 * Calculates the relative luminance of a color
 * Based on WCAG 2.0 formula
 */
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Parses a hex color string to RGB values
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
 * Determines whether to use white or black text on a given background color
 * Returns 'white' or 'black' based on contrast ratio
 *
 * @param backgroundColor - Hex color string (e.g., '#3b82f6')
 * @returns 'white' or 'black'
 */
export const getContrastColor = (backgroundColor: string): 'white' | 'black' => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return 'black'; // Fallback for invalid colors

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);

  // Use white text for dark backgrounds, black for light backgrounds
  // Threshold of 0.5 works well for most cases
  return luminance > 0.5 ? 'black' : 'white';
};

/**
 * Lightens or darkens a hex color by a percentage
 *
 * @param color - Hex color string
 * @param percent - Positive to lighten, negative to darken (0-100)
 */
export const adjustColorBrightness = (color: string, percent: number): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const adjust = (value: number) => {
    const adjusted = value + (value * percent) / 100;
    return Math.min(255, Math.max(0, Math.round(adjusted)));
  };

  const r = adjust(rgb.r).toString(16).padStart(2, '0');
  const g = adjust(rgb.g).toString(16).padStart(2, '0');
  const b = adjust(rgb.b).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
};
