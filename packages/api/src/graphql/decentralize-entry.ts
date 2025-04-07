import axios from 'axios';
import { GraphQLError } from 'graphql';
import { fetchAndConvertImage } from 'src/util/image-conversion';
import Pinanta from 'src/util/pinanta';
import { Context } from 'src/util/types';

const ipfsProtocolUrl = (hash: string) => {
	return `ipfs://${hash}`;
};

export const decentralizeEntryResolver = async (_: any, { contract, tokenId, network }: any, context: Context) => {
	const pinata = new Pinanta(context.env);
	const networks: { [key: string]: string } = {
		ethereum: 'eth-mainnet',
		polygon: 'polygon-mainnet',
		solana: 'solana-mainnet',
	};

	const alchemyUrl = `https://${networks[network]}.g.alchemy.com/nft/v3/${context.env.ALCHEMY_API_KEY}/getNFTMetadata?contractAddress=${contract}&tokenId=${tokenId}&refreshCache=false`;

	const { data } = await axios.get(alchemyUrl);

	const tokenUri = data.tokenUri;

	let ipfsHashes = {
		media: '',
		metadata: '',
		contract,
		tokenId,
		network,
	};

	let { data: metadata } = await axios.get(tokenUri);

	const convertedAnimation = await fetchAndConvertImage(metadata.image);
	let imageHash;
	if (convertedAnimation) {
		const { IpfsHash } = await pinata.pinBuffer(convertedAnimation);
		imageHash = IpfsHash;
	} else {
		imageHash = await pinata.getIpfsHashForMedia(metadata.image);
	}

	const animationHash = await pinata.getIpfsHashForMedia(metadata.animation_url);

	if (!animationHash) {
		throw new GraphQLError('No animation hash found.');
	}
	if (!imageHash) {
		throw new GraphQLError('No image hash found.');
	}

	metadata.image = ipfsProtocolUrl(imageHash);
	metadata.animation_url = ipfsProtocolUrl(animationHash);
	metadata.networks = {};
	metadata.networks[network] = { [contract]: [tokenId] };

	ipfsHashes.metadata = await pinata.pinJSON(metadata);
	ipfsHashes.media = animationHash;

	return ipfsHashes;
};
