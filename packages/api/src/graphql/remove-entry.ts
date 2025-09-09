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
		// Delete from Algolia
		await algolia.deleteEntry(id);

		// Remove from Soroban contract index (admin-only)
		try {
			const contract = new ContractClient(ctx.env);
			await contract.removeEntry(id);
		} catch (e) {
			console.log('Contract remove_entry failed', e);
		}

		// Also delete associated objects in R2 under prefix `${id}/`
		const s3 = new S3Client({
			region: 'auto',
			endpoint: ctx.env.R2_ENDPOINT,
			credentials: {
				accessKeyId: ctx.env.R2_ACCESS_KEY_ID,
				secretAccessKey: ctx.env.R2_SECRET_ACCESS_KEY,
			},
		});

		const bucket = ctx.env.R2_BUCKET;
		const prefix = `${id}/`;

		const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
		const toDelete = (listed.Contents || []).map((o) => ({ Key: o.Key! }));
		if (toDelete.length > 0) {
			await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: toDelete } }));
		}

		return true;
	}

	// give permision if user is owner

	return false;
};
