import { Entry } from 'app/api/graphql/types';
/**
 * Hook to handle like cache manipulation
 */
export default function useLikeCache(): {
    addLikeToCache: (entry: Entry) => void;
    removeLikeFromCache: (entry: Entry) => void;
};
//# sourceMappingURL=useLikeCache.d.ts.map