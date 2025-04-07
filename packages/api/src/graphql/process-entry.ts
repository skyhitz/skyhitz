import ContractClient from '../../contract';
import { decentralizeEntryResolver } from './decentralize-entry';
import { indexEntryResolver } from './index-entry';
import { Context } from 'src/util/types';

export const processEntryResolver = async (_: any, { contract, tokenId, network }: any, ctx: Context) => {
	const stellarContract = new ContractClient(ctx.env);
	const { media: fileCid, metadata: metaCid } = await decentralizeEntryResolver(
		_,
		{
			contract,
			tokenId,
			network,
		},
		ctx
	);

	const res = await indexEntryResolver(_, { contract, tokenId, network, metaCid, fileCid }, ctx);

	let newEntry = {
		apr: BigInt(0),
		tvl: BigInt(0),
		escrow: BigInt(0),
		shares: new Map(),
		id: res.id,
	};
	await stellarContract.setEntry(newEntry);
	return res;
};
