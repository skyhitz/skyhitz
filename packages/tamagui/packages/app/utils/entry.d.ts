/**
 * Checks if a URL is an IPFS URL
 * @param url URL to check
 * @returns boolean indicating if the URL is an IPFS URL
 */
export declare function isIpfs(url?: string): boolean;
export declare function videoSrc(videoUrl?: string, useFallback?: boolean): string;
export declare function imageSrc(imageUrl?: string): string;
export declare function metaSrc(metaHash: string): string;
/**
 * Formats the image URL to return the small-sized version
 * @param imageUrl Original image URL
 * @returns URL for small-sized image
 */
export declare function imageUrlSmall(imageUrl?: string): string;
/**
 * Formats the image URL to return the medium-sized version
 * @param imageUrl Original image URL
 * @returns URL for medium-sized image
 */
export declare function imageUrlMedium(imageUrl?: string): string;
//# sourceMappingURL=entry.d.ts.map