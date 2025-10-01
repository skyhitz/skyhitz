/**
 * Cross-platform color scheme hook that works on both web and native
 * - On web: Uses direct DOM manipulation to avoid React state update errors
 * - On native: Uses NativeWind's hook but with error prevention
 */
export declare function useColorScheme(): {
    colorScheme: string;
    isDark: boolean;
    toggleColorScheme: () => void;
    setColorScheme: (scheme: "light" | "dark") => void;
};
//# sourceMappingURL=useColorScheme.d.ts.map