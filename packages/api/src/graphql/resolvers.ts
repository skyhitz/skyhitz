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
import { submitLinkResolver } from './submit-link';
import { createPaymentIntentResolver } from './create-payment-intent';
import { checkPendingWithdrawalsResolver } from './check-pending-withdrawals';
import { claimEarningsResolver } from './claim-earnings';
import { searchExternalMusicResolver, externalAudioUrlResolver } from './search-external-music';
import { claimEarningsPreviewResolver } from './xlm-price';
import { mineExternalEntryResolver } from './mine-external-entry';
import { mergeEntriesResolver } from './merge-entries';
import { unstakeEntryResolver } from './unstake-entry';
import { recordActionResolver } from './record-action';
import { userHitzBalanceResolver } from './user-hitz-balance';
import { withdrawHitzResolver } from './withdraw-hitz';
import { pendingMinesResolver, pendingMineResolver, rejectPendingMineResolver } from './pending-mines';
import { approvePendingMineResolver } from './approve-pending-mine';
import { mergePendingMineResolver } from './merge-pending-mine';
import { uploadMintResolver } from './upload-mint';
// REMOVED: sellSharesResolver - no longer supported in new contract

const Query = {
	entry: entryByIdResolver,
	entryLikes: entryLikesResolver,
	userCredits: userCreditsResolver,
	userHitzBalance: userHitzBalanceResolver,
	userEntries: userEntriesResolver,
	userLikes: userLikesResolver,
	xlmPrice: XLMPriceResolver,
	searchExternalMusic: searchExternalMusicResolver,
	externalAudioUrl: externalAudioUrlResolver,
	claimableEarningsPreview: claimEarningsPreviewResolver,
	pendingMines: pendingMinesResolver,
	pendingMine: pendingMineResolver,
};

const Mutation = {
	checkPendingWithdrawals: checkPendingWithdrawalsResolver,
	createPaymentIntent: createPaymentIntentResolver,
	createUserWithEmail: createUserWithEmailResolver,
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
	unstakeEntry: unstakeEntryResolver,
	withdrawHitz: withdrawHitzResolver,
	recordAction: recordActionResolver,
	// REMOVED: sellShares - no longer supported
	mergeEntries: mergeEntriesResolver,
	approvePendingMine: approvePendingMineResolver,
	mergePendingMine: mergePendingMineResolver,
	rejectPendingMine: rejectPendingMineResolver,
	uploadMint: uploadMintResolver,
	updateUser: updateUserResolver,
	withdrawToExternalWallet: withdrawToExternalAddressResolver,
};

export const resolvers = {
	Query,
	Mutation,
};
