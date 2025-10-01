import { Post } from 'app/types/index';
export declare const appDomain: string;
export declare const algoliaClient: import("algoliasearch").Algoliasearch;
export declare const indexNames: {
    entries: string;
    users: string;
    blog: string;
    shares: string;
    entriesRatingDesc: string;
    entriesTimestampDesc: string;
};
/**
 * Helper function to search a specific index using the v5 API
 * @param indexName The name of the index to search
 * @param query The search query
 * @param options Additional search options
 * @returns Search results
 */
export declare function searchIndex(indexName: string, query: string, options?: any): Promise<import("algoliasearch").SearchResponse<unknown>>;
/**
 * Helper function to get a single object by ID from an index
 * @param indexName The name of the index
 * @param objectID The ID of the object to retrieve
 * @returns The requested object
 */
export declare function getObject(indexName: string, objectID: string): Promise<Record<string, unknown>>;
export declare const entriesIndex: {
    search: <T>(query: string, options?: any) => Promise<import("algoliasearch").SearchResponse<unknown>>;
    getObject: <T>(objectID: string) => Promise<T>;
};
export declare const usersIndex: {
    search: <T>(query: string, options?: any) => Promise<import("algoliasearch").SearchResponse<unknown>>;
    getObject: <T>(objectID: string) => Promise<T>;
};
export declare const ratingEntriesIndex: {
    search: <T>(query: string, options?: any) => Promise<import("algoliasearch").SearchResponse<unknown>>;
    getObject: <T>(objectID: string) => Promise<T>;
};
export declare const blogIndex: {
    search: <T>(query: string, options?: any) => Promise<import("algoliasearch").SearchResponse<unknown>>;
    getObject: <T>(objectID: string) => Promise<T>;
};
export declare function fetchPost(slug: string): Promise<Post>;
export declare function fetchBlogPosts(page?: number, hitsPerPage?: number): Promise<Post[]>;
/**
 * Fetches blog posts for the home page
 * @param hitsPerPage Number of posts to fetch
 * @returns An array of HomePost objects
 */
export declare function fetchHomePagePosts(hitsPerPage?: number): Promise<Post[]>;
export declare const sharesIndex: {
    search: <T>(query: string, options?: any) => Promise<import("algoliasearch").SearchResponse<unknown>>;
    getObject: <T>(objectID: string) => Promise<T>;
};
//# sourceMappingURL=index.d.ts.map