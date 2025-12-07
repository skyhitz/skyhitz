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
	contract?: string;
	tokenId?: string;
	network?: string;
	source?: string;
	sourceId?: string;
	tvl?: number;
	apr?: number;
	escrow?: number;
	totalStaked?: number;
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

export interface PendingMine {
	objectID: string; // Unique ID for the pending mine
	userId: string; // User who attempted to mine
	userEmail: string; // User's email
	userName: string; // User's display name
	track: {
		id: string;
		title: string;
		artist?: string;
		genre?: string;
		source: 'audius' | 'soundxyz';
		url?: string;
		imageUrl?: string;
	};
	similarTracks: Array<{
		id: string;
		title: string;
		artist?: string;
		similarity: number;
	}>;
	status: 'pending' | 'approved' | 'merged' | 'rejected';
	createdAt: string;
	createdAtTimestamp: number;
	resolvedAt?: string;
	resolvedBy?: string; // Admin user ID who resolved it
	mergedToId?: string; // If merged, the entry ID it was merged to
}

export interface PendingUpload {
	objectID: string; // Unique ID for the pending upload
	userId: string; // User who uploaded
	userEmail: string; // User's email
	userName: string; // User's display name
	// Upload details
	audioHash: string; // IPFS hash stored in R2
	imageHash: string; // IPFS hash stored in R2
	title: string;
	artist: string;
	description?: string;
	// Status
	status: 'pending' | 'approved' | 'rejected';
	createdAt: string;
	createdAtTimestamp: number;
	resolvedAt?: string;
	resolvedBy?: string; // Curator user ID who resolved it
	rejectionReason?: string;
	// Approval details (set when approved)
	qualityScore?: number; // 2, 4, 6, 8, or 10 (from 1-5 star rating)
	isAiGenerated?: boolean; // Curator's assessment
}

export interface Curator {
	objectID: string; // Same as userId
	userId: string;
	userEmail: string;
	userName: string;
	addedAt: string;
	addedAtTimestamp: number;
	addedBy: string; // User ID who added this curator
	addedByName: string; // Name of user who added this curator
}
