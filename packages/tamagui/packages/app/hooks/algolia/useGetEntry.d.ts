import { Entry } from 'app/api/graphql/types';
type Props = {
    id: string;
    serverEntry?: Entry;
};
type Result = {
    entry?: Entry;
    getEntry: (id: string) => Promise<Entry | null>;
    refetch: () => Promise<void>;
};
export declare function useGetEntry({ id, serverEntry }: Props): Result;
export {};
//# sourceMappingURL=useGetEntry.d.ts.map