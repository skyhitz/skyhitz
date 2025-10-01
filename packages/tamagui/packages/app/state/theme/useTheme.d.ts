export declare const themes: {
    light: any;
    dark: any;
};
/**
 * Simple theme hook that uses our custom useColorScheme which bypasses NativeWind's React state updates
 */
export declare function useTheme(): {
    isDark: boolean;
    colorScheme: string;
    toggleTheme: () => void;
    setDarkTheme: () => void;
    setLightTheme: () => void;
    setColorScheme: (scheme: "light" | "dark") => void;
    theme: any;
};
//# sourceMappingURL=useTheme.d.ts.map