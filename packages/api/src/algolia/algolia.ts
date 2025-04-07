import algoliasearch, { SearchIndex } from 'algoliasearch';
import { createFetchRequester } from '@algolia/requester-fetch';

import { Entry, KrakenWithdrawal, Share, Timestamp, User } from '../util/types';

export class AlgoliaClient {
	public indices: {
		entriesIndex: SearchIndex;
		usersIndex: SearchIndex;
		passwordlessIndex: SearchIndex;
		likesIndex: SearchIndex;
		likeCountReplicaIndex: SearchIndex;
		sharesIndex: SearchIndex;
		submitIndex: SearchIndex;
		ratingReplicaIndex: SearchIndex;
		timestampReplicaDesc: SearchIndex;
		timestampReplicaAsc: SearchIndex;
		distributionTimestampsIndex: SearchIndex;
		withdrawalsIndex: SearchIndex;
	};

	constructor(env: Env) {
		const client = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_ADMIN_API_KEY, {
			requester: createFetchRequester(),
		});
		const appDomain = env.APP_URL.replace('https://', '');

		this.indices = {
			entriesIndex: client.initIndex(`${appDomain}:entries`),
			usersIndex: client.initIndex(`${appDomain}:users`),
			passwordlessIndex: client.initIndex(`${appDomain}:pwdless`),
			likesIndex: client.initIndex(`${appDomain}:likes`),
			likeCountReplicaIndex: client.initIndex(`${appDomain}:entries_likes_desc`),
			sharesIndex: client.initIndex(`${appDomain}:shares`),
			submitIndex: client.initIndex(`${appDomain}:submit`),
			ratingReplicaIndex: client.initIndex(`${appDomain}:entries_rating_desc`),
			timestampReplicaDesc: client.initIndex(`${appDomain}:entries_timestamp_desc`),
			timestampReplicaAsc: client.initIndex(`${appDomain}:entries_timestamp_asc`),
			distributionTimestampsIndex: client.initIndex(`${appDomain}:distribution_timestamps`),
			withdrawalsIndex: client.initIndex(`${appDomain}:withdrawals`),
		};
	}

	async partialUpdateEntry(obj: any) {
		return this.indices.entriesIndex.partialUpdateObject(obj).wait();
	}

	async partialUpdateUsers(obj: any) {
		return this.indices.usersIndex.partialUpdateObjects(obj).wait();
	}

	async saveEntry(entry: Entry) {
		return this.indices.entriesIndex.saveObject(entry);
	}

	async getUser(id: string): Promise<User> {
		return this.indices.usersIndex.getObject(id);
	}

	async getEntry(id: string): Promise<Entry> {
		return this.indices.entriesIndex.getObject(id);
	}

	async getAllEntries(): Promise<Entry[]> {
		const hitsPerPage = 1000; // Adjust based on your needs
		let allEntries: Entry[] = [];
		let page = 0;
		let hasMore = true;

		while (hasMore) {
			const res = await this.indices.entriesIndex.search('', {
				hitsPerPage,
				page,
			});
			allEntries = allEntries.concat(res.hits as Entry[]);
			hasMore = res.hits.length === hitsPerPage;
			page++;
		}

		return allEntries;
	}

	async deleteEntry(id: string) {
		return this.indices.entriesIndex.deleteObject(id);
	}

	async getEntryByCode(code: string) {
		const res = await this.indices.entriesIndex.search('', {
			filters: `code:${code}`,
		});
		const [entry]: unknown[] = res.hits;
		return entry as Entry;
	}

	async getByUsernameOrEmailOrPublicKey(username: string, email: string, publicKey?: string) {
		const res = await this.indices.usersIndex.search<User>('', {
			filters: `username:${username} OR email:${email} ${publicKey ? 'OR publicKey:' + publicKey : ''}`,
		});
		const [user] = res.hits;
		return user;
	}

	async getByUsernameOrEmailExcludingId(username: string, email: string, id: string) {
		const res = await this.indices.usersIndex.search<User>('', {
			filters: `(username:${username} OR email:${email}) AND NOT objectID:"${id}"`,
		});
		const [user] = res.hits;
		return user;
	}

	async getUserByEmail(email: string) {
		const res = await this.indices.usersIndex.search('', {
			filters: `email:${email}`,
		});
		const [user] = res.hits;
		return user as User;
	}

	async getUserByPublicKey(publicKey: string) {
		const res = await this.indices.usersIndex.search('', {
			filters: `publicKey:${publicKey}`,
		});
		if (res.hits.length === 0) {
			throw 'User not found';
		}
		const [user] = res.hits;
		return user as User;
	}

	async saveUser(user: User) {
		return this.indices.usersIndex.saveObject(user).wait();
	}

	async likeMulti(userId: string, entryId: string) {
		const { likeCount } = await this.getEntry(entryId);
		const likeCountNumber = likeCount ? likeCount + 1 : 1;

		try {
			await Promise.all([
				this.indices.likesIndex.saveObject({
					objectID: `user${userId}entry${entryId}`,
					likeCount: likeCountNumber ? likeCountNumber : 0,
					entryId: entryId,
					userId: userId,
				}),
				this.indices.likesIndex.saveObject({
					objectID: `entry${entryId}user${userId}`,
					likeCount: likeCountNumber ? likeCountNumber : 0,
					entryId: entryId,
					userId: userId,
				}),
				this.indices.entriesIndex.partialUpdateObject({
					objectID: entryId,
					likeCount: {
						_operation: 'Increment',
						value: 1,
					},
				}),
			]);
			return true;
		} catch (e) {
			console.log(e);
			return false;
		}
	}

	async unlikeMulti(userId: string, entryId: string) {
		try {
			await Promise.all([
				this.indices.likesIndex.deleteObject(`user${userId}entry${entryId}`),
				this.indices.likesIndex.deleteObject(`entry${entryId}user${userId}`),
				this.indices.entriesIndex.partialUpdateObject({
					objectID: entryId,
					likeCount: {
						_operation: 'Decrement',
						value: 1,
					},
				}),
			]);
			return true;
		} catch (e) {
			return false;
		}
	}

	async getUsersLikesWithEntryId(entryId: string) {
		const prefix = 'user';
		const likes = await this.indices.likesIndex.search(`entry${entryId}`);
		const users = await this.indices.usersIndex.getObjects(
			likes.hits.map(({ objectID }) => objectID.substring(objectID.lastIndexOf(prefix) + prefix.length))
		);
		return users.results as User[];
	}

	async getEntriesLikesWithUserId(userId: string) {
		const prefix = 'entry';
		const likes = await this.indices.likesIndex.search(`user${userId}`);
		const objectIDs = likes.hits.map(({ objectID }) => objectID.substring(objectID.lastIndexOf(prefix) + prefix.length));
		const entries = await this.indices.entriesIndex.getObjects(objectIDs);

		return entries.results as unknown as Entry[];
	}

	async updateUser(user: User) {
		return this.indices.usersIndex.partialUpdateObject(user);
	}

	async partialUpdateUser(obj: any) {
		return this.indices.usersIndex.partialUpdateObject(obj).wait();
	}

	async updateUserMinBalance(userId: string, minBalance: number) {
		return this.indices.usersIndex
			.partialUpdateObject({
				objectID: userId,
				minBalance: minBalance,
			})
			.wait();
	}

	async getCollection(userId: string) {
		const res = await this.indices.sharesIndex.search('', {
			filters: `userId:${userId}`,
		});
		return res.hits as Share[];
	}

	async getMultiEntries(ids: string[]) {
		const res = await this.indices.entriesIndex.getObjects(ids);
		return res.results as Entry[];
	}

	async updateShares(entryId: string, userId: string, shares: number) {
		return this.indices.sharesIndex.saveObject({
			objectID: `entry${entryId}user${userId}`,
			entryId,
			userId,
			shares,
		});
	}

	async addToSubmitIndex(email: string, link: string) {
		return this.indices.submitIndex.saveObject({ objectID: `${email}-${link}`, email: email, link: link });
	}

	async getDistributionTimestamp(key: string): Promise<number | null> {
		try {
			const obj: Timestamp = await this.indices.distributionTimestampsIndex.getObject(key);
			if (obj && obj.timestamp) return obj.timestamp;
		} catch (error: any) {
			return null;
		}
		return null;
	}

	async setDistributionTimestamp(key: string, value: number): Promise<void> {
		await this.indices.distributionTimestampsIndex.saveObject({ objectID: key, timestamp: value });
	}

	async saveWithdrawal(withdrawal: KrakenWithdrawal) {
		return this.indices.withdrawalsIndex.saveObject(withdrawal);
	}

	async getPendingWithdrawals() {
		const withdrawals = await this.indices.withdrawalsIndex.search('', {
			filters: 'status:pending',
		});
		return withdrawals.hits as unknown as KrakenWithdrawal[];
	}

	async updateWithdrawalStatus(refId: string, status: string) {
		return this.indices.withdrawalsIndex.partialUpdateObject({
			objectID: refId,
			status,
		});
	}

	async deleteWithdrawal(refId: string) {
		return this.indices.withdrawalsIndex.deleteObject(refId);
	}
}
