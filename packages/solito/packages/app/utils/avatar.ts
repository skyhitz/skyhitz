/**
 * Utilities for generating consistent avatar placeholders
 */

// Predefined gradient pairs (start color, end color)
export const gradientPairs = [
  ['#FF5E3A', '#FF2A68'], // Warm Red
  ['#FF9500', '#FF5E3A'], // Orange
  ['#4CD964', '#5AC8FA'], // Green to Blue
  ['#5AC8FA', '#007AFF'], // Blue
  ['#3F51B5', '#7986CB'], // Indigo
  ['#9C27B0', '#E1BEE7'], // Purple
  ['#2196F3', '#03A9F4'], // Light Blue
  ['#00BCD4', '#B2EBF2'], // Cyan
  ['#009688', '#4DB6AC'], // Teal
  ['#F44336', '#E57373'], // Red
];

// Text color for each gradient pair - matched for readability
export const textColors = [
  '#FFFFFF', // White for dark red
  '#FFFFFF', // White for orange
  '#FFFFFF', // White for green-blue
  '#FFFFFF', // White for blue
  '#FFFFFF', // White for indigo
  '#FFFFFF', // White for purple
  '#FFFFFF', // White for light blue
  '#000000', // Black for light cyan
  '#FFFFFF', // White for teal
  '#FFFFFF', // White for red
];

/**
 * Generate a consistent hash code from a string
 */
export const hashString = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash);
};

/**
 * Get a deterministic gradient index based on user identifier
 */
export const getGradientIndex = (identifier: string): number => {
  const hash = hashString(identifier);
  return hash % gradientPairs.length;
};

/**
 * Get initials from display name
 */
export const getInitials = (displayName?: string | null): string => {
  if (!displayName) return '?';
  
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.charAt(0)?.toUpperCase() || '?';
  }
  
  const firstInitial = parts[0]?.charAt(0) || '';
  const lastInitial = parts[parts.length - 1]?.charAt(0) || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

/**
 * Get an identifier string from user data
 * Uses ID first, then name, then a fallback
 */
export const getUserIdentifier = (id?: string | null, displayName?: string | null): string => {
  if (id) return id;
  if (displayName) return displayName;
  return 'default-user';
};

/**
 * Get font size class based on avatar size and initials length
 */
export const getFontSizeClass = (size: 'small' | 'medium' | 'large' | 'xlarge', initialsLength: number): string => {
  if (size === 'small') return 'text-xs';
  if (size === 'medium') return initialsLength > 1 ? 'text-sm' : 'text-base';
  if (size === 'large') return initialsLength > 1 ? 'text-base' : 'text-lg';
  return initialsLength > 1 ? 'text-lg' : 'text-xl'; // xlarge
};
