import { User } from 'app/api/graphql/types';
export declare const AuthService: {
    /**
     * Checks if user is authenticated by looking for valid token
     */
    isAuthenticated: () => Promise<boolean>;
    /**
     * Logs the user out by clearing their auth token
     */
    logout: () => Promise<void>;
    /**
     * Attempts to restore user data from storage if available
     */
    restoreUserFromStorage: () => Promise<User | null>;
    /**
     * Stores auth token in secure storage
     */
    saveAuthToken: (token: string) => Promise<void>;
};
//# sourceMappingURL=auth.d.ts.map