import { User } from './types';
export type RequestTokenMutationVariables = {
    usernameOrEmail: string;
};
export type SignInWithTokenMutationVariables = {
    uid: string;
    token: string;
};
export type CreateUserWithEmailMutationVariables = {
    username: string;
    displayName: string;
    email: string;
    signedXDR?: string;
};
export type CreateUserWithEmailResponse = {
    createUserWithEmail: {
        message: string;
        user?: User;
    };
};
export type UpdateUserMutationVariables = {
    displayName?: string;
    username?: string;
    email?: string;
    avatarUrl?: string;
    backgroundUrl?: string;
    twitter?: string;
    instagram?: string;
};
export type WithdrawToExternalWalletMutationVariables = {
    address: string;
    amount: number;
};
export type CreatePaymentIntentMutationVariables = {
    amount: number;
};
export type CreatePaymentIntentResponse = {
    createPaymentIntent: {
        clientSecret: string;
    };
};
export declare function useRequestTokenMutation(options?: {
    onCompleted?: () => void;
}): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
export declare function useSignInWithTokenMutation(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
export declare function useCreateUserWithEmailMutation(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
export declare function useUserCreditsQuery(): import("@apollo/client").InteropQueryResult<any, import("@apollo/client").OperationVariables>;
export declare function useUserCollectionQuery(userId: string): import("@apollo/client").InteropQueryResult<any, import("@apollo/client").OperationVariables>;
export declare function useUserLikesQuery(): import("@apollo/client").InteropQueryResult<any, import("@apollo/client").OperationVariables>;
export declare function useUpdateUserMutation(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
export declare function useWithdrawToExternalWalletMutation(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
export declare function useClaimEarningsMutation(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
export declare function useCreatePaymentIntentMutation(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
export declare function useEntriesSearchLazyQuery(): import("@apollo/client").LazyQueryResultTuple<any, import("@apollo/client").OperationVariables>;
export declare function useUsersSearchLazyQuery(): import("@apollo/client").LazyQueryResultTuple<any, import("@apollo/client").OperationVariables>;
export declare function useRecentlyAddedEntriesQuery(): import("@apollo/client").InteropQueryResult<any, import("@apollo/client").OperationVariables>;
//# sourceMappingURL=mutations.d.ts.map