type AuthProtectionOptions = {
    /**
     * If true, will redirect to sign-in when not authenticated
     * Default: true
     */
    redirectWhenUnauthenticated?: boolean;
    /**
     * If true, will redirect to search when already authenticated
     * (useful for auth pages like sign-in/sign-up)
     * Default: false
     */
    redirectWhenAuthenticated?: boolean;
    /**
     * Custom redirect path when not authenticated
     * Default: ROUTES.SIGN_IN
     */
    unauthenticatedRedirect?: string;
    /**
     * Custom redirect path when authenticated
     * Default: ROUTES.SEARCH
     */
    authenticatedRedirect?: string;
};
/**
 * Hook to handle authentication-based redirects
 *
 * Use this hook at the top of components that need auth protection
 * or to prevent authenticated users from accessing auth pages
 */
export declare function useAuthProtection(options?: AuthProtectionOptions): {
    isAuthenticated: boolean;
};
export {};
//# sourceMappingURL=useAuthProtection.d.ts.map