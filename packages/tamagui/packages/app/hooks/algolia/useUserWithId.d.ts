import { SWRResponse } from 'swr';
import { Hit } from '@algolia/client-search';
import { User } from 'app/api/graphql/types';
export declare const useUserWithId: (id?: string | null) => SWRResponse<Hit<User>, any, any>;
//# sourceMappingURL=useUserWithId.d.ts.map