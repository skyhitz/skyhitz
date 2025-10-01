/**
 * Navigation hook for auth-related routes
 */
export declare function useAuthNavigation(): {
    /**
     * Navigate to the sign in page
     */
    goToSignIn: () => void;
    /**
     * Navigate to the sign up page
     */
    goToSignUp: () => void;
    /**
     * Navigate to sign in with token page (from email link)
     */
    goToSignInWithToken: (token: string, uid: string) => void;
    /**
     * Navigate to the main app after successful authentication
     * (replaces current route to prevent back navigation to auth screens)
     */
    goToMainAppAfterAuth: () => void;
};
/**
 * Navigation hook for profile-related routes
 */
export declare function useProfileNavigation(): {
    /**
     * Navigate to user's own profile
     */
    goToMyProfile: () => void;
    /**
     * Navigate to profile likes
     */
    goToProfileLikes: () => void;
    /**
     * Navigate to profile collection
     */
    goToProfileCollection: () => void;
    /**
     * Navigate to profile edit page
     */
    goToProfileEdit: () => void;
    /**
     * Is user currently on any profile route
     */
    isProfileActive: boolean;
};
/**
 * Navigation hook for content-related routes
 */
export declare function useContentNavigation(): {
    /**
     * Navigate to the search page
     */
    goToSearch: () => void;
    /**
     * Navigate to the charts page
     */
    goToChart: () => void;
    /**
     * Navigate to a specific beat/track
     */
    goToBeat: (id: string) => void;
};
//# sourceMappingURL=useFeatureNavigation.d.ts.map