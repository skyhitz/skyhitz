
import { Keypair } from '@stellar/stellar-sdk';
import ContractClient from '../../skyhitz-analysis/skyhitz/packages/api/contract/index';

// USAGE: npx ts-node reset_total_minted.ts <ADMIN_SECRET> <NEW_TOTAL_MINTED_STROOPS>

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error("Usage: npx ts-node reset_total_minted.ts <ADMIN_SECRET> <NEW_TOTAL_MINTED_STROOPS>");
    process.exit(1);
}

const ADMIN_SECRET = args[0];
const NEW_TOTAL = BigInt(args[1]);

async function main() {
    const env = {
        ISSUER_SEED: ADMIN_SECRET,
        STELLAR_NETWORK: 'mainnet'
    } as any;

    const client = new ContractClient(env);

    console.log(`Using Admin: ${Keypair.fromSecret(ADMIN_SECRET).publicKey()}`);
    console.log(`Resetting Total Minted to: ${NEW_TOTAL} stroops (${Number(NEW_TOTAL) / 10_000_000} HITZ)`);

    // Note: We need to access the raw client exposed in our wrapper or add a wrapper method.
    // Since we added it to client.ts (the raw SDK), we can access it via client.contract (the raw client instance).
    // Reviewing index.ts: "this.contract = this.getClientForKeypair(this.sourceKeys);"
    // But ContractClient class in index.ts exposes specific methods.
    // We should probably add a wrapper method to index.ts too, OR just cast the raw client.

    // Let's use the raw client via reflection since index.ts wrapper wasn't updated
    const rawClient = (client as any).contract;

    // Call the function
    const tx = await rawClient.admin_set_total_minted({
        new_amount: NEW_TOTAL
    });

    const result = await tx.signAndSend();
    console.log("Success! TX Hash:", result.result);
}

main().catch(console.error);
