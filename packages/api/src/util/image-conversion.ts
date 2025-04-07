import { ipfsGateway } from 'src/constants/constants';

// Define a function to map initial URLs to transformed URLs
function getTransformedUrl(initialUrl: string) {
	let url = '';
	if (initialUrl.includes('ar://')) {
		url = initialUrl.replace('ar://', 'https://arweave.net/');
	}
	if (initialUrl.includes('ipfs://')) {
		url = initialUrl.replace('ipfs://', `${ipfsGateway}/`);
	}
	return url ? url : initialUrl;
}

// Fetch and transform the image using Cloudflare Workers and Image Resizing
export async function fetchAndConvertImage(initialUrl: string) {
	const imageUrl = getTransformedUrl(initialUrl);

	try {
		// Fetch the image
		const response = await fetch(imageUrl, { cf: { image: { format: 'webp' } } });

		if (!response.ok) {
			throw new Error(`Error fetching image: ${response.statusText}`);
		}

		const imageBuffer = await response.arrayBuffer();
		console.log('Conversion complete.');
		return Buffer.from(imageBuffer);
	} catch (error) {
		console.error('Error:', error);
		throw error; // Rethrow to handle it outside the function
	}
}
