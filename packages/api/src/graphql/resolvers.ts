import { entryByIdResolver } from './entry';
import { entryLikesResolver } from './entry-likes';
import { requestTokenResolver } from './request-token';
import { signInWithTokenResolver } from './sign-in-with-token';
import { userCreditsResolver } from './user-credits';
import { userEntriesResolver } from './user-entries';
import { userLikesResolver } from './user-likes';
import { XLMPriceResolver } from './xlm-price';
import { investEntryResolver } from './invest-entry';
import { createUserWithEmailResolver } from './create-user-with-email';
import { setLastPlayedEntryResolver } from './set-last-played-entry';
import { updateUserResolver } from './update-user';
import { likeEntryResolver } from './like-entry';
import { removeEntryResolver } from './remove-entry';
import { withdrawToExternalAddressResolver } from './withdraw-to-external-wallet';
import { processEntryResolver } from './process-entry';
import { initContractResolver } from './init-contract';
import { submitLinkResolver } from './submit-link';
import { createPaymentIntentResolver } from './create-payment-intent';
import { checkPendingWithdrawalsResolver } from './check-pending-withdrawals';
import { claimEarningsResolver } from './claim-earnings';
import { searchExternalMusicResolver, externalAudioUrlResolver } from './search-external-music';
import { claimEarningsPreviewResolver } from './xlm-price';
import { issueCardResolver, myCardResolver, issuingElementsClientSecretResolver } from 'src/graphql/stripe-issuing';
import { mineExternalEntryResolver } from './mine-external-entry';

const Query = {
	entry: entryByIdResolver,
	entryLikes: entryLikesResolver,
	userCredits: userCreditsResolver,
	userEntries: userEntriesResolver,
	userLikes: userLikesResolver,
	xlmPrice: XLMPriceResolver,
	searchExternalMusic: searchExternalMusicResolver,
	externalAudioUrl: externalAudioUrlResolver,
	claimableEarningsPreview: claimEarningsPreviewResolver,
	myCard: myCardResolver,
	issuingElementsClientSecret: issuingElementsClientSecretResolver,
};

const Mutation = {
	checkPendingWithdrawals: checkPendingWithdrawalsResolver,
	createPaymentIntent: createPaymentIntentResolver,
	createUserWithEmail: createUserWithEmailResolver,
	initContract: initContractResolver,
	investEntry: investEntryResolver,
	likeEntry: likeEntryResolver,
	processEntry: processEntryResolver,
	removeEntry: removeEntryResolver,
	requestToken: requestTokenResolver,
	setLastPlayedEntry: setLastPlayedEntryResolver,
	signInWithToken: signInWithTokenResolver,
	submitLink: submitLinkResolver,
	claimEarnings: claimEarningsResolver,
	mineExternalEntry: mineExternalEntryResolver,
	issueCard: issueCardResolver,
	updateUser: updateUserResolver,
	withdrawToExternalWallet: withdrawToExternalAddressResolver,
};

export const resolvers = {
	Query,
	Mutation,
};
