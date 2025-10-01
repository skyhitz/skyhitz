import { Entry } from 'app/api/graphql/types';
export declare const recentlyAddedQueryKey = "recentlyAdded?page=";
export declare function useRecentlyAdded(): {
    data: Entry[];
    onNextPage: () => void;
    loading: boolean;
    loadMoreEnabled: boolean;
    isLoadingMore: boolean;
};
//# sourceMappingURL=useRecentlyAdded.d.ts.map