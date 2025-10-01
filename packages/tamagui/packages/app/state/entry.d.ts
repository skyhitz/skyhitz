import { Entry } from 'app/api/graphql/types';
interface EntryState {
    entry: Entry | undefined;
    setEntry: (entry: Entry | undefined) => void;
    resetEntry: () => void;
}
export declare const useEntryStore: import("zustand").UseBoundStore<import("zustand").StoreApi<EntryState>>;
export {};
//# sourceMappingURL=entry.d.ts.map