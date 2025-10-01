import { User } from 'app/api/graphql/types';
/**
 * AuthService provides utilities for managing authentication state
 */
export declare class AuthService {
    /**
     * Restores user data from secure storage if available
     */
    static restoreUserFromStorage(): Promise<User | null>;
    /**
     * Checks if the user is authenticated
     */
    static isAuthenticated(): Promise<boolean>;
    /**
     * Gets the authentication token from storage
     */
    static getAuthToken(): Promise<string | null>;
}
//# sourceMappingURL=index.d.ts.map