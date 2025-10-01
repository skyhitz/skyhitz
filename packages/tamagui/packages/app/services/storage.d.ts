export declare const STORAGE_KEYS: {
    AUTH_TOKEN: string;
    USER_DATA: string;
    PREFERENCES: string;
};
export declare const secureStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
};
//# sourceMappingURL=storage.d.ts.map