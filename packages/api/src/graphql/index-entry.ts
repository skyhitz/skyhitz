import axios from 'axios';
import { fallbackIpfsGateway, pinataIpfsGateway } from '../constants/constants';
import { GraphQLError } from 'graphql';
import { requireAuth } from 'src/auth/auth-context';
import { AlgoliaClient } from 'src/algolia/algolia';
import { Entry } from 'src/util/types';

export const indexEntryResolver = async (_: any, { issuer, contract, tokenId, network, metaCid, fileCid }: any, ctx: any) => {
	await requireAuth(ctx);

	const algolia = new AlgoliaClient(ctx.env);

	const decodedIpfshash = metaCid;

	let response;

	response = await axios
		.get(`${pinataIpfsGateway}/${decodedIpfshash}`, {
			timeout: 15 * 1000,
		})
		.then(({ data }) => data)
		.catch((error) => {
			console.log(error);
			return null;
		});
	if (response === null) {
		console.log('Trying fallback gateway');
		response = await axios
			.get(`${fallbackIpfsGateway}/${decodedIpfshash}`, {
				timeout: 15 * 1000,
			})
			.then(({ data }) => data)
			.catch((error) => {
				console.log(error);
				return null;
			});
	}

	if (response === null) {
		throw new GraphQLError("Couldn't fetch the nft metadata from ipfs");
	}

	const {
		name,
		description,
		// code: metaCode,
		// issuer: metaIssuer,
		// domain,
		// supply,
		image,
		animation_url,
		// video,
	} = response;

	const video = animation_url;

	console.log('Pinned media to pinata!');

	let entry;
	try {
		entry = await algolia.getEntry(decodedIpfshash);
	} catch {}

	const nameDivider = ' - ';
	const obj: Entry = {
		description,
		imageUrl: image,
		videoUrl: video,
		id: decodedIpfshash,
		objectID: decodedIpfshash,
		likeCount: entry?.likeCount ? entry.likeCount : 0,
		// title: name.substring(name.indexOf(nameDivider) + nameDivider.length)
		title: entry?.title ? entry.title : name,
		artist: entry?.artist ? entry.artist : name.substring(0, name.indexOf(nameDivider)),
		publishedAt: new Date().toISOString(),
		publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
		contract: contract ? contract : '',
		tokenId: tokenId ? tokenId : '',
		network: network ? network : '',
	};

	console.log('indexed entry:', obj);

	if (
		name &&
		description &&
		// domain &&
		// supply &&
		image &&
		animation_url &&
		video
	) {
		try {
			await algolia.saveEntry(obj);

			return obj;
		} catch (ex) {
			throw new GraphQLError("Couldn't index entry.");
		}
	}
	throw new GraphQLError('Invalid entry metadata');
};
