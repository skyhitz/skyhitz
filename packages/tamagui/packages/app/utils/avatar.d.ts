/**
 * Utilities for generating consistent avatar placeholders
 */
export declare const gradientPairs: string[][];
export declare const textColors: string[];
/**
 * Generate a consistent hash code from a string
 */
export declare const hashString: (str: string) => number;
/**
 * Get a deterministic gradient index based on user identifier
 */
export declare const getGradientIndex: (identifier: string) => number;
/**
 * Get initials from display name
 */
export declare const getInitials: (displayName?: string | null) => string;
/**
 * Get an identifier string from user data
 * Uses ID first, then name, then a fallback
 */
export declare const getUserIdentifier: (id?: string | null, displayName?: string | null) => string;
/**
 * Get font size class based on avatar size and initials length
 */
export declare const getFontSizeClass: (size: "small" | "medium" | "large" | "xlarge", initialsLength: number) => string;
//# sourceMappingURL=avatar.d.ts.map