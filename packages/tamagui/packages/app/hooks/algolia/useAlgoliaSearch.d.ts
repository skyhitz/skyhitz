import { ErrorType } from 'app/types';
type Props = {
    searchPhrase: string;
    indexName: string;
};
type SearchResult<T> = {
    loading: boolean;
    data: T[];
    error?: ErrorType;
};
export declare function useAlgoliaSearch<T>({ searchPhrase, indexName, }: Props): SearchResult<T>;
export {};
//# sourceMappingURL=useAlgoliaSearch.d.ts.map