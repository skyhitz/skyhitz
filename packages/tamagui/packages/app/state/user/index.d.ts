import { User } from 'app/api/graphql/types';
interface UserState {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    isAuthenticated: () => boolean;
    userId: () => string | null;
    userPublicKey: () => string | null;
    userEmail: () => string | null;
}
export declare const useUserStore: import("zustand").UseBoundStore<import("zustand").StoreApi<UserState>>;
export {};
//# sourceMappingURL=index.d.ts.map