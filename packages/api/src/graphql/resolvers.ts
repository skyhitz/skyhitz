import { entryByIdResolver } from './entry';
import { entryLikesResolver } from './entry-likes';
import { requestTokenResolver } from './request-token';
import { signInWithTokenResolver } from './sign-in-with-token';
import { userEntriesResolver } from './user-entries';
import { userLikesResolver } from './user-likes';
import { investEntryResolver } from './invest-entry';
import { createUserWithEmailResolver } from './create-user-with-email';
import { setLastPlayedEntryResolver } from './set-last-played-entry';
import { updateUserResolver } from './update-user';
import { likeEntryResolver } from './like-entry';
import { removeEntryResolver } from './remove-entry';
import { processEntryResolver } from './process-entry';
import { submitLinkResolver } from './submit-link';
import { createPaymentIntentResolver } from './create-payment-intent';
import { checkPendingWithdrawalsResolver } from './check-pending-withdrawals';
import { claimEarningsResolver, claimEarningsPreviewResolver } from './claim-earnings';
import { searchExternalMusicResolver, externalAudioUrlResolver } from './search-external-music';
import { mineExternalEntryResolver } from './mine-external-entry';
import { mergeEntriesResolver } from './merge-entries';
import { unstakeEntryResolver } from './unstake-entry';
import { recordActionResolver } from './record-action';
import { userHitzBalanceResolver } from './user-hitz-balance';
import { hitzPriceUsdcResolver } from './hitz-price-usdc';
import { withdrawHitzResolver } from './withdraw-hitz';
import { pendingMinesResolver, pendingMineResolver, rejectPendingMineResolver } from './pending-mines';
import { approvePendingMineResolver } from './approve-pending-mine';
import { mergePendingMineResolver } from './merge-pending-mine';
import {
	pendingUploadsResolver,
	pendingUploadsCountResolver,
	pendingUploadResolver,
	approvePendingUploadResolver,
	rejectPendingUploadResolver,
} from './pending-uploads';
import {
	isCuratorResolver,
	curatorsResolver,
	addCuratorResolver,
	removeCuratorResolver,
} from './curators';
// REMOVED: sellSharesResolver - no longer supported in new contract
// REMOVED: uploadMintResolver - replaced with curator approval flow

const Query = {
	entry: entryByIdResolver,
	entryLikes: entryLikesResolver,
	userHitzBalance: userHitzBalanceResolver,
	hitzPriceUsdc: hitzPriceUsdcResolver,
	userEntries: userEntriesResolver,
	userLikes: userLikesResolver,
	searchExternalMusic: searchExternalMusicResolver,
	externalAudioUrl: externalAudioUrlResolver,
	claimableEarningsPreview: claimEarningsPreviewResolver,
	pendingMines: pendingMinesResolver,
	pendingMine: pendingMineResolver,
	pendingUploads: pendingUploadsResolver,
	pendingUploadsCount: pendingUploadsCountResolver,
	pendingUpload: pendingUploadResolver,
	isCurator: isCuratorResolver,
	curators: curatorsResolver,
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
	approvePendingUpload: approvePendingUploadResolver,
	rejectPendingUpload: rejectPendingUploadResolver,
	addCurator: addCuratorResolver,
	removeCurator: removeCuratorResolver,
	updateUser: updateUserResolver,
};

export const resolvers = {
	Query,
	Mutation,
};
