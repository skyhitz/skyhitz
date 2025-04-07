import axios from 'axios';

type PinRes = {
	IpfsHash: string;
	PinSize: number;
	Timestamp: string;
	isDuplicate: boolean;
};
const ipfsUrl = 'https://ipfs.io/ipfs';

class Pinanta {
	private pinataApi: string = 'https://api.pinata.cloud';
	private pinataJwt: string;

	constructor(env: Env) {
		this.pinataJwt = env.PINATA_JWT || '';
	}

	public async pinIpfsFile(ipfsHash: string, name: string): Promise<unknown> {
		return await axios
			.post(
				`${this.pinataApi}/pinning/pinByHash`,
				{
					hashToPin: ipfsHash,
					pinataMetadata: {
						name: name,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${this.pinataJwt}`,
						'Content-Type': 'application/json',
					},
				}
			)
			.then(({ data }) => data)
			.catch((error) => {
				console.log(error);
				return null;
			});
	}

	public async pinBuffer(buffer: Buffer): Promise<PinRes> {
		let data = new FormData();

		const blob = new Blob([buffer]);

		data.append('file', blob);

		return this.pinData(data);
	}

	public async pinData(data: FormData) {
		const options = JSON.stringify({
			cidVersion: 1,
		});
		data.append('pinataOptions', options);

		const res = await fetch(`${this.pinataApi}/pinning/pinFileToIPFS`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.pinataJwt}`,
			},
			body: data,
		});
		const resData = await res.json();
		if (!resData) {
			throw new Error('Error pinning data to Pinata');
		}
		return resData as PinRes;
	}

	public async pinAssetUrl(url: string): Promise<PinRes> {
		console.log(url);
		const data = new FormData();
		const response = await axios.get(url, {
			responseType: 'arraybuffer',
		});

		const blob = new Blob([response.data]);
		data.append(`file`, blob);
		return this.pinData(data);
	}

	public async pinJSON(centralizedMeta: any) {
		const body = {
			pinataContent: centralizedMeta,
			pinataOptions: { cidVersion: 1 },
		};

		const { data }: { data: PinRes } = await axios.post(`${this.pinataApi}/pinning/pinJSONToIPFS`, body, {
			headers: { Authorization: `Bearer ${this.pinataJwt}` },
		});

		return data.IpfsHash;
	}

	public async pinExternalUrl(initial_url: string) {
		let url = '';
		if (initial_url.includes('ar://')) {
			url = initial_url.replace('ar://', 'https://arweave.net/');
		}

		const final_url = url ? url : initial_url;
		const res = await axios.head(final_url);

		if (res.status === 200) {
			// pin the url of the asset
			const { IpfsHash } = await this.pinAssetUrl(final_url);

			if (IpfsHash) {
				return IpfsHash;
			}
		}

		return null;
	}

	public async getIpfsHashForMedia(media: string) {
		var parts = media.split('/');

		if (parts[parts.length - 2].includes('ipfs') || parts[0].includes('ipfs:')) {
			return await this.findAndPinIpfsHash(parts);
		} else if (media) {
			const IpfsHash = await this.pinExternalUrl(media);

			if (IpfsHash) {
				return IpfsHash;
			}
		}
	}

	public async findAndPinIpfsHash(parts: string[]) {
		var ipfsHash = parts.pop() || parts.pop();

		const res = await axios.head(`${ipfsUrl}/${ipfsHash}`);

		if (res.status === 200) {
			// pin it to our server
			if (!ipfsHash) {
				return null;
			}
			await this.pinIpfsFile(ipfsHash, ipfsHash);
			return ipfsHash;
		}
	}
}

export default Pinanta;
