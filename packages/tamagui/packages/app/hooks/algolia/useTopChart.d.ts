import { Entry } from 'app/api/graphql/types';
export declare const topChartQueryKey = "topChart?page=";
export declare function useTopChart(pageStart?: number): {
    data: Entry[];
    onNextPage: () => void;
    loading: boolean;
    loadMoreEnabled: boolean;
    isLoadingMore: boolean;
};
//# sourceMappingURL=useTopChart.d.ts.map