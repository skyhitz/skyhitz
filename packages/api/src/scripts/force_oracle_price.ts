
import { Keypair } from '@stellar/stellar-sdk';
import ContractClient from '../../contract';

// USAGE: npx ts-node packages/api/src/scripts/force_oracle_price.ts <TREASURY_SECRET> <PRICE_IN_STROOPS>

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error("Usage: npx ts-node force_oracle_price.ts <TREASURY_SECRET> <PRICE_IN_STROOPS>");
    process.exit(1);
}

const TREASURY_SECRET = args[0];
const NEW_PRICE = BigInt(args[1]);

async function main() {
    const env = {
        TREASURY_SEED: TREASURY_SECRET,
        STELLAR_NETWORK: 'mainnet'
    } as any;

    const client = new ContractClient(env);

    // We need to use updateOraclePrice method which is exposed in index.ts wrapper
    // It takes (treasurySeed, newPrice)

    console.log(`Using Treasury: ${Keypair.fromSecret(TREASURY_SECRET).publicKey()}`);
    console.log(`Setting Oracle Price to: ${NEW_PRICE} stroops`);

    await client.updateOraclePrice(TREASURY_SECRET, NEW_PRICE);

    console.log("Success! Price updated.");
}

main().catch(console.error);
