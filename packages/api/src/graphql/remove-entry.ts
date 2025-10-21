import { AlgoliaClient } from 'src/algolia/algolia';
import { requireAuth } from 'src/auth/auth-context';
import { Context } from 'src/util/types';
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import ContractClient from '../../contract';
const adminId = '-NpzLBvz8ypxJwnK3JVL';

export const removeEntryResolver = async (_: any, { id }: any, ctx: Context) => {
	const user = requireAuth(ctx);
	const algolia = new AlgoliaClient(ctx.env);

	if (user.id === adminId) {
		// Read entry first to gather associated media hashes
		let entry: any = null;
		try {
			entry = await algolia.getEntry(id);
		} catch (_) {}

		// Get all stakers for this entry from Algolia
		let stakers: string[] = [];
		try {
			const shares = await algolia.getSharesByEntry(id);
			if (shares.length > 0) {
				// Get user objects to retrieve their publicKeys
				const userIds = shares.map((share) => share.userId);
				const users = await algolia.indices.usersIndex.getObjects(userIds);
				// Filter out null results and extract publicKeys
				stakers = users.results
					.filter((user: any) => user !== null && user.publicKey)
					.map((user: any) => user.publicKey);
				console.log(`Found ${stakers.length} stakers for entry ${id}`);
			}
		} catch (e) {
			console.log('Failed to fetch stakers from Algolia:', e);
			// Continue with empty stakers array - will only work if entry has no stakes
		}

		// Remove from Soroban contract index (admin-only)
		try {
			const contract = new ContractClient(ctx.env);
			await contract.removeEntry(id, stakers);
		} catch (e) {
			console.log('Contract remove_entry failed', e);
		}

		// Also delete associated objects in R2 under relevant prefixes
		const s3 = new S3Client({
			region: 'auto',
			endpoint: ctx.env.R2_ENDPOINT,
			credentials: {
				accessKeyId: ctx.env.R2_ACCESS_KEY_ID,
				secretAccessKey: ctx.env.R2_SECRET_ACCESS_KEY,
			},
		});

		const bucket = ctx.env.R2_BUCKET;

		const extractHash = (url?: string) => {
			if (!url) return null;
			if (url.startsWith('ipfs://')) return url.replace('ipfs://', '');
			return null;
		};

		const imageHash = extractHash(entry?.imageUrl);
		const videoHash = extractHash(entry?.videoUrl);

		const prefixes = new Set<string>();
		// metadata
		prefixes.add(`${id}/`);
		prefixes.add(`${id}/mp4/`);
		prefixes.add(`${id}/hls/`);
		// image
		if (imageHash) {
			prefixes.add(`${imageHash}/`);
		}
		// audio/video
		if (videoHash) {
			prefixes.add(`${videoHash}/`);
			prefixes.add(`${videoHash}/mp4/`);
			prefixes.add(`${videoHash}/hls/`);
		}

		for (const prefix of prefixes) {
			const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
			const toDelete = (listed.Contents || []).map((o) => ({ Key: o.Key! }));
			if (toDelete.length > 0) {
				await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: toDelete } }));
			}
		}

		// Delete from Algolia last (entry and shares)
		await Promise.all([
			algolia.deleteEntry(id),
			algolia.deleteSharesByEntry(id)
		]);

		return true;
	}

	// give permision if user is owner

	return false;
};
