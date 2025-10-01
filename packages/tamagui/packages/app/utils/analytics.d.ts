/**
 * Google Analytics tracking utilities
 * Provides a unified interface for tracking events across web and mobile platforms
 */
export type AnalyticsEvent = 'signed_in' | 'signed_out' | 'sign_up' | 'stream' | 'like' | 'download' | 'invest' | 'mine' | 'top_up' | 'copy_wallet';
export interface AnalyticsEventParams {
    event_name: AnalyticsEvent;
    entry_id?: string;
    entry_title?: string;
    entry_artist?: string;
    amount?: number;
    currency?: string;
    user_id?: string;
    [key: string]: any;
}
/**
 * Track an analytics event
 * @param params - Event parameters including event_name and additional data
 */
export declare function trackEvent(params: AnalyticsEventParams): void;
/**
 * Track user sign-in
 */
export declare function trackSignIn(userId?: string): void;
/**
 * Track user sign-up
 */
export declare function trackSignUp(userId?: string): void;
/**
 * Track user sign-out
 */
export declare function trackSignOut(userId?: string): void;
/**
 * Track stream/playback event
 */
export declare function trackStream(entryId: string, entryTitle?: string, entryArtist?: string): void;
/**
 * Track like event
 */
export declare function trackLike(entryId: string, entryTitle?: string, entryArtist?: string): void;
/**
 * Track download event
 */
export declare function trackDownload(entryId: string, entryTitle?: string, entryArtist?: string): void;
/**
 * Track investment event
 */
export declare function trackInvest(entryId: string, amount: number, currency?: string, entryTitle?: string, entryArtist?: string): void;
/**
 * Track top-up event
 */
export declare function trackTopUp(userId?: string, source?: string, amount?: number): void;
/**
 * Track mine event
 */
export declare function trackMine(entryId: string, entryTitle?: string, entryArtist?: string): void;
/**
 * Track wallet copy event
 */
export declare function trackCopyWallet(userId?: string, source?: string): void;
//# sourceMappingURL=analytics.d.ts.map