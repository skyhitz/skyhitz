---
id: deploy
title: Deploy & Environments
---

## Application Deployment

### API (Cloudflare Workers)

```bash
# Development
yarn api:dev

# Deploy to production
yarn api:deploy
```

### Web (Next.js on Cloudflare Pages)

```bash
# Development
yarn ui:dev:prod   # Or env-specific variants

# Build for Cloudflare
yarn cf:build

# Deploy
yarn cf:deploy            # Default
yarn cf:deploy:staging    # Staging
yarn cf:deploy:production # Production
```

### Documentation (Docusaurus)

```bash
# Local development
yarn docs:start

# Build
yarn docs:build  # Output: packages/docs/build
```

## Smart Contract Deployment

### Prerequisites

- Rust toolchain with `wasm32-unknown-unknown` target
- Stellar CLI (`stellar` or `soroban`)
- Admin wallet with sufficient XLM

### Build Contract

```bash
cd packages/api/contract
cargo build --target wasm32-unknown-unknown --release
```

Output: `target/wasm32-unknown-unknown/release/skyhitz.wasm`

### Deploy New Contract

```bash
# Deploy WASM
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/skyhitz.wasm \
  --source-account $ADMIN_KEY \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015"

# Initialize (one-time)
stellar contract invoke \
  --id $CONTRACT_ID \
  --source-account $ADMIN_KEY \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  -- init \
  --admin $ADMIN_ADDRESS \
  --treasury $TREASURY_ADDRESS \
  --hitz-token $HITZ_TOKEN_ID \
  --base-fee 1000000
```

### Upgrade Existing Contract

```bash
# Install new WASM and get hash
stellar contract install \
  --wasm target/wasm32-unknown-unknown/release/skyhitz.wasm \
  --source-account $ADMIN_KEY \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015"

# Upgrade contract
stellar contract invoke \
  --id $CONTRACT_ID \
  --source-account $ADMIN_KEY \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  -- upgrade_core \
  --new-wasm-hash $NEW_WASM_HASH
```

### Testnet Commands

```bash
# Testnet setup
yarn workspace @skyhitz/api testnet:contract:setup

# Testnet upgrade
yarn workspace @skyhitz/api testnet:contract:upgrade
```

### Mainnet Commands

```bash
# Mainnet setup
yarn workspace @skyhitz/api mainnet:contract:setup

# Mainnet upgrade
yarn workspace @skyhitz/api mainnet:contract:upgrade

# Generate TypeScript bindings
yarn workspace @skyhitz/api mainnet:contract:bindings
```

## Environment Variables

### API Worker

| Variable | Description |
|----------|-------------|
| `ALGOLIA_ADMIN_KEY` | Algolia admin API key |
| `ALGOLIA_APP_ID` | Algolia application ID |
| `ISSUER_SEED` | Platform issuer wallet seed |
| `TREASURY_SEED` | Treasury wallet seed |
| `JWT_SECRET` | JWT signing secret |
| `ENCRYPTION_KEY` | User seed encryption key |
| `POSTMARK_SERVER_TOKEN` | Email service token |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `STELLAR_NETWORK` | Network (`testnet` or `mainnet`) |
| `CONTRACT_ID` | Skyhitz Core contract ID |
| `HITZ_TOKEN_ID` | HITZ token contract ID |

### Web Application

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_EXPO_SKYHITZ_ENV` | Environment name |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key |

Set per-environment in `packages/solito/apps/next/wrangler.toml`.

## Contract Configuration

### V2 Post-Exhaustion Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| Base Fee | 1,000,000 stroops | 0.1 HITZ |
| Min Invest | 30,000,000 stroops | 3 HITZ |
| Distribution Rate | 5 bps | 0.05% daily |
| Max Entries | 10,000 | DOS protection |

### Wallet Separation

| Wallet | Purpose | Storage |
|--------|---------|---------|
| Admin | Governance | Cold storage |
| Treasury | Distributions | Hot wallet |

## Deployment Checklist

### Pre-Deployment

- [ ] Tests passing (`cargo test`)
- [ ] WASM builds successfully
- [ ] Admin wallet has sufficient XLM
- [ ] Backup of current contract state

### Deployment

- [ ] Deploy/install WASM
- [ ] Upgrade contract (if upgrading)
- [ ] Verify contract version
- [ ] Test key functions

### Post-Deployment

- [ ] Update API environment variables
- [ ] Regenerate TypeScript bindings
- [ ] Deploy API with new contract ID
- [ ] Verify end-to-end functionality
- [ ] Monitor for errors

## Rollback Procedure

If issues are detected after deployment:

1. **Stop Treasury Bot**: Disable cron trigger
2. **Assess Impact**: Check contract state and user balances
3. **Deploy Previous Version**: Re-install previous WASM and upgrade
4. **Verify Rollback**: Test critical functions
5. **Restart Treasury Bot**: Re-enable cron trigger
6. **Post-Mortem**: Document what went wrong

## Monitoring

After deployment, monitor:

- Contract invocation success rate
- Treasury bot execution logs
- User action failures
- APR calculations
- Algolia sync status

See [Treasury Bot](treasury-bot) for bot-specific monitoring.
