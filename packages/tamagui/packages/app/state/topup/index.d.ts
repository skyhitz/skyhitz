type TopUpAction = 'mine' | 'download' | 'like' | 'playback';
type TopUpContext = {
    action: TopUpAction;
    requiredXLM: number;
    availableXLM: number;
    message?: string;
};
type TopUpModalState = {
    visible: boolean;
    context: TopUpContext | null;
    openTopUpModal: (ctx: TopUpContext) => void;
    closeTopUpModal: () => void;
};
export declare const useTopUpModalStore: import("zustand").UseBoundStore<import("zustand").StoreApi<TopUpModalState>>;
export {};
//# sourceMappingURL=index.d.ts.map