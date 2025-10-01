export type ThemeState = {
    isDark: boolean;
    toggleTheme: () => void;
    setDarkTheme: () => void;
    setLightTheme: () => void;
};
export declare const useThemeStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ThemeState>, "setState" | "persist"> & {
    setState(partial: ThemeState | Partial<ThemeState> | ((state: ThemeState) => ThemeState | Partial<ThemeState>), replace?: false | undefined): unknown;
    setState(state: ThemeState | ((state: ThemeState) => ThemeState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ThemeState, unknown, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ThemeState) => void) => () => void;
        onFinishHydration: (fn: (state: ThemeState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<ThemeState, unknown, unknown>>;
    };
}>;
//# sourceMappingURL=index.d.ts.map