type ReturnValue<T> = {
    data: T[];
    onNextPage: () => void;
    loading: boolean;
    loadMoreEnabled: boolean;
    isLoadingMore: boolean;
};
type Props<T> = {
    fetcher: (key: string) => Promise<T[]>;
    commonKey: string;
    pageSize: number;
};
export declare function usePaginatedAlgoliaSearch<T>({ fetcher, commonKey, pageSize, }: Props<T>): ReturnValue<T>;
export {};
//# sourceMappingURL=usePaginatedAlgoliaSearch.d.ts.map