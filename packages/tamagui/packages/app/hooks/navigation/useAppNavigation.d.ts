export type RouteParams = {
    [key: string]: string | number;
};
export declare function useAppNavigation(): {
    push: (url: Parameters<(href: string, options?: import("next/dist/shared/lib/app-router-context.shared-runtime").NavigateOptions) => void>[0], navigateOptions?: Parameters<(href: string, options?: import("next/dist/shared/lib/app-router-context.shared-runtime").NavigateOptions) => void>[1]) => void;
    replace: (url: Parameters<(href: string, options?: import("next/dist/shared/lib/app-router-context.shared-runtime").NavigateOptions) => void>[0], navigateOptions?: Parameters<(href: string, options?: import("next/dist/shared/lib/app-router-context.shared-runtime").NavigateOptions) => void>[1] & {
        experimental?: {
            nativeBehavior?: undefined;
        } | {
            nativeBehavior: "stack-replace";
            isNestedNavigator: boolean;
        };
    }) => void;
    back: () => void;
    pathname: string;
    navigateTo: (route: string, params?: RouteParams) => void;
    replaceTo: (route: string, params?: RouteParams) => void;
    buildPath: (route: string, params?: RouteParams) => string;
    getCurrentSegment: () => string;
    isCurrentRoute: (route: string) => boolean;
    isRouteActive: (route: string) => boolean;
};
//# sourceMappingURL=useAppNavigation.d.ts.map