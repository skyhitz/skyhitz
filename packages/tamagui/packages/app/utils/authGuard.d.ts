import { PropsWithChildren } from 'react';
/**
 * Higher-order component to guard routes that require authentication
 */
export declare function ComponentAuthGuard({ children }: PropsWithChildren): import("react/jsx-runtime").JSX.Element | null;
/**
 * Route guard for Next.js app directory pages
 */
export declare function RouteAuthGuard(): Promise<{
    redirect: {
        destination: string;
        permanent: boolean;
    };
}>;
//# sourceMappingURL=authGuard.d.ts.map