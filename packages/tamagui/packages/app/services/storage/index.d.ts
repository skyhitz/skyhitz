/**
 * Cross-platform secure storage abstraction
 *
 * This is a placeholder implementation that will be replaced with:
 * - Web: localStorage with encryption
 * - iOS: Keychain
 * - Android: EncryptedSharedPreferences
 */
export declare const STORAGE_KEYS: {
    AUTH_TOKEN: string;
    USER_DATA: string;
};
declare class StorageService {
    private storage;
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
}
export declare const secureStorage: StorageService;
export {};
//# sourceMappingURL=index.d.ts.map