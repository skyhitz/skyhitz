/**
 * Application route constants
 *
 * This file centralizes all route definitions used throughout the application,
 * making it easier to maintain and update paths consistently.
 */
export declare const ROUTES: {
    HOME: string;
    MUSIC: string;
    CHART: string;
    PROFILE: string;
    SEARCH: string;
    SIGN_IN: string;
    SIGN_UP: string;
    SIGN_IN_WITH_TOKEN: string;
    PROFILE_LIKES: string;
    PROFILE_COLLECTION: string;
    PROFILE_EDIT: string;
};
/**
 * Routes that should include the main navigation UI (navbar + tab bar)
 */
export declare const NAVIGATION_ROUTES: string[];
/**
 * Check if a given pathname should use navigation UI
 */
export declare function shouldUseNavigationUI(pathname: string | null): boolean;
//# sourceMappingURL=routes.d.ts.map