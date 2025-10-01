import { User } from 'app/api/graphql/types';
export declare function useUserState(): {
    user: User | null;
    loading: boolean;
    updateUser: (newUser: User | null) => void;
    setLoading: (loading: boolean) => void;
};
export declare function useIsAuthenticated(): boolean;
export declare function useUserId(): string | null;
export declare function useUserPublicKey(): string | null;
export declare function useUserEmail(): string | null;
//# sourceMappingURL=hooks.d.ts.map