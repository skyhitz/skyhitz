export type User = {
	avatarUrl: string;
	backgroundUrl: string;
	displayName: string;
	description: string;
	email: string;
	username: string;
	id: string;
	publishedAt: string;
	publishedAtTimestamp: number;
	objectID: string;
	publicKey: string;
	seed: string;
	version: number;
	jwt?: string;
	lastPlayedEntry?: Entry;
	twitter: string;
	instagram: string;
	minBalance?: number;
	claimEarnings?: {
		success: boolean;
		totalClaimedAmount: number;
		claimedEntries: Array<{
			entryId: string;
			amount: number;
		}>;
	};
};

export type Entry = {
	id: string;
	imageUrl: string;
	description: string;
	title: string;
	artist: string;
	videoUrl: string;
	publishedAt: string;
	publishedAtTimestamp: number;
	likeCount: number;
	objectID: string;
	contract: string;
	tokenId: string;
	network: string;
	tvl?: number;
	apr?: number;
	escrow?: number;
	shares?: Map<string, number>;
};

export type Share = {
	entryId: string;
	userId: string;
	shares: number;
	objectID: string;
};

export type HiddenBid = {
	id: string;
	hiddenBy: string[];
};

export type EmbeddedOffer = {
	_embedded: { records: Offer[] };
};

export type Offer = {
	id: string;
	seller: string;
	selling:
		| {
				asset_type: 'native';
		  }
		| {
				asset_type: 'credit_alphanum12' | 'credit_alphanum4';
				asset_code: string;
				asset_issuer: string;
		  };
	buying:
		| {
				asset_type: 'native';
		  }
		| {
				asset_type: 'credit_alphanum12' | 'credit_alphanum4';
				asset_code: string;
				asset_issuer: string;
		  };
	// The amount of selling that the account making this offer is willing to sell.
	amount: string;
	// How many units of buying it takes to get 1 unit of selling. A number representing the decimal form of price_r.
	price: string;
};

export interface Context {
	user?: User;
	env: Env;
}

export type Timestamp = {
	objectID: string;
	timestamp: number;
};

export interface KrakenWithdrawal {
	objectID: string; // refid
	amount: number;
	status: string;
	email: string;
	timestamp: number;
}

export interface KrakenWithdrawStatus {
	result: Array<{
		refid: string;
		status: string;
		asset: string;
	}>;
	error: string[];
}

export interface KrakenAddOrderRes {
	result: {
		descr: {
			order: string;
			close: string;
		};
		txid: string[];
	};
	error: string[];
}
