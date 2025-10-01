import type { Post } from 'app/types/index';
export declare const queryKey = "blog?page=";
export declare const pageSize = 20;
export declare function useBlogPosts(pageStart?: number): {
    data: Post[];
    onNextPage: () => void;
    loading: boolean;
    loadMoreEnabled: boolean;
    isLoadingMore: boolean;
};
//# sourceMappingURL=useBlogPosts.d.ts.map