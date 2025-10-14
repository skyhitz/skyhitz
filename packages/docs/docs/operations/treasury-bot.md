---
id: treasury-bot
title: Treasury Bot System
---

This page documents the Treasury Bot system, which automates the conversion of XLM fees to HITZ rewards and their distribution to entry pools.

## Overview

The Treasury Bot is a critical component of the Skyhitz economic system. It:

1. **Collects** accumulated XLM fees from user actions
2. **Converts** XLM to HITZ on the Stellar DEX
3. **Distributes** HITZ to entry reward pools proportionally

**Key Point**: The bot only handles market operations (XLM → HITZ conversion). The Core contract handles all distribution logic automatically.

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│                 Treasury Bot                        │
│  (Automated Script - runs on schedule)              │
│                                                      │
│  1. Check Treasury wallet XLM balance               │
│  2. If balance > threshold:                         │
│     a) Buy HITZ on Stellar DEX                      │
│     b) Call Core.distribute_rewards()               │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Uses Treasury keypair (NOT admin)
                   ▼
┌─────────────────────────────────────────────────────┐
│            Treasury Wallet                          │
│  (Hot wallet - separate from admin)                 │
│                                                      │
│  - Receives all XLM fees from user actions          │
│  - Signs distribute_rewards() transactions          │
│  - No governance powers                             │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ distribute_rewards(treasury_addr, hitz_amount)
                   ▼
┌─────────────────────────────────────────────────────┐
│         Skyhitz Core Contract                       │
│  (Smart contract - handles distribution logic)      │
│                                                      │
│  1. Verify caller is Treasury                       │
│  2. Transfer HITZ from Treasury to contract         │
│  3. Calculate total_escrow across all entries       │
│  4. For each entry:                                 │
│     share = (entry.escrow_xlm / total) × hitz       │
│     entry.reward_pool += share                      │
│  5. Update all APRs                                 │
└─────────────────────────────────────────────────────┘
```

### Wallet Separation

| Wallet | Purpose | Keys | Permissions | Risk Level |
|--------|---------|------|-------------|------------|
| **Admin** | Governance, upgrades | Cold storage (offline) | All contract admin functions | Low (offline) |
| **Treasury** | Automated operations | Hot wallet (online) | Only `distribute_rewards()` | Medium (limited) |

**Security Benefit**: If Treasury keys are compromised, attacker can only call `distribute_rewards()`, which benefits the platform. Admin keys remain safe in cold storage.

---

## How It Works

### 1. Fee Collection

As users perform actions, XLM fees accumulate in the Treasury wallet:

| Action | XLM Fee | Destination |
|--------|---------|-------------|
| Stream | 0.01 XLM | Treasury |
| Like | 0.02 XLM | Treasury |
| Download | 0.03 XLM | Treasury |
| Mine | 0.1 XLM | Treasury |
| Invest 1 XLM | 1.0 XLM | Treasury |

**Example**:
```
Day 1-7 user actions:
- 1000 streams = 10 XLM
- 500 likes = 10 XLM
- 100 downloads = 3 XLM
- 50 mines = 5 XLM
- 20 invests (avg 2 XLM) = 40 XLM

Total collected: 68 XLM
```

### 2. XLM → HITZ Conversion

When Treasury balance exceeds threshold, bot buys HITZ on Stellar DEX:

```typescript
// Pseudo-code
const xlmBalance = await getTreasuryBalance('XLM')
const threshold = 10 // XLM

if (xlmBalance >= threshold) {
    // Place market order or path payment
    const hitzBought = await stellarDex.buy({
        selling: 'XLM',
        buying: 'HITZ',
        amount: xlmBalance,
        maxSlippage: 0.05 // 5%
    })
    
    console.log(`Bought ${hitzBought} HITZ with ${xlmBalance} XLM`)
}
```

**Trading Strategy Options**:
- **Market Order**: Fast, may have slippage
- **Limit Order**: Better price, may not fill immediately
- **Path Payment**: Find best conversion path through order books
- **Liquidity Pool**: If HITZ/XLM pool exists (future)

### 3. Distribution to Entry Pools

Bot calls `distribute_rewards()` with purchased HITZ:

```typescript
// Pseudo-code
await coreContract.distribute_rewards(
    treasuryKeypair.publicKey(),  // caller parameter
    hitzBought,                    // amount in stroops
    { signer: treasuryKeypair }    // Treasury signs
)
```

Core contract then distributes proportionally:

```
Entry A: 500 XLM escrow (50% of total) → gets 50% of HITZ
Entry B: 300 XLM escrow (30% of total) → gets 30% of HITZ
Entry C: 200 XLM escrow (20% of total) → gets 20% of HITZ
```

**Key Point**: Bot doesn't need to know about individual entries. Contract handles everything.

---

## Implementation

### Bot Structure

```typescript
// packages/api/src/treasury/bot.ts

interface TreasuryBotConfig {
    treasurySecretKey: string
    coreContractId: string
    hitzTokenId: string
    xlmThreshold: number
    stellarNetwork: 'testnet' | 'public'
    runInterval: number // seconds
}

class TreasuryBot {
    private config: TreasuryBotConfig
    private treasuryKeypair: Keypair
    private server: Server
    private coreContract: Contract
    
    constructor(config: TreasuryBotConfig) {
        this.config = config
        this.treasuryKeypair = Keypair.fromSecret(config.treasurySecretKey)
        this.server = new Server(/* ... */)
        this.coreContract = new Contract(config.coreContractId)
    }
    
    async run() {
        console.log('Treasury Bot starting...')
        
        while (true) {
            try {
                await this.cycle()
            } catch (error) {
                console.error('Cycle error:', error)
            }
            
            // Wait for next interval
            await sleep(this.config.runInterval * 1000)
        }
    }
    
    async cycle() {
        console.log('Starting treasury cycle...')
        
        // 1. Check balance
        const xlmBalance = await this.getXlmBalance()
        console.log(`Treasury XLM balance: ${xlmBalance}`)
        
        if (xlmBalance < this.config.xlmThreshold) {
            console.log('Below threshold, skipping cycle')
            return
        }
        
        // 2. Buy HITZ
        const hitzBought = await this.buyHitz(xlmBalance)
        console.log(`Bought ${hitzBought} HITZ`)
        
        // 3. Distribute to contract
        const result = await this.distributeRewards(hitzBought)
        console.log(`Distributed to ${result.entriesUpdated} entries`)
        
        console.log('Cycle complete')
    }
    
    async getXlmBalance(): Promise<number> {
        const account = await this.server.loadAccount(
            this.treasuryKeypair.publicKey()
        )
        
        const xlmBalance = account.balances.find(
            b => b.asset_type === 'native'
        )
        
        return xlmBalance ? parseFloat(xlmBalance.balance) : 0
    }
    
    async buyHitz(xlmAmount: number): Promise<number> {
        // Implementation depends on DEX setup
        // Could use path payment, manage sell, or liquidity pool
        
        // Example: Path payment
        const tx = new TransactionBuilder(/* ... */)
            .addOperation(Operation.pathPaymentStrictSend({
                sendAsset: Asset.native(),
                sendAmount: xlmAmount.toString(),
                destination: this.treasuryKeypair.publicKey(),
                destAsset: new Asset('HITZ', this.config.hitzTokenId),
                destMin: (xlmAmount * 0.95).toString(), // 5% slippage tolerance
                path: [] // Let Stellar find best path
            }))
            .build()
        
        tx.sign(this.treasuryKeypair)
        const result = await this.server.submitTransaction(tx)
        
        // Extract actual HITZ received from result
        return extractHitzReceived(result)
    }
    
    async distributeRewards(hitzAmount: number): Promise<any> {
        // Convert to stroops
        const hitzStroops = BigInt(Math.floor(hitzAmount * 10_000_000))
        
        // Call contract
        const result = await this.coreContract.distribute_rewards({
            caller: this.treasuryKeypair.publicKey(),
            hitz_amount: hitzStroops
        }, {
            signer: this.treasuryKeypair
        })
        
        return result
    }
}

// Start bot
const config: TreasuryBotConfig = {
    treasurySecretKey: process.env.TREASURY_SECRET_KEY!,
    coreContractId: process.env.CORE_CONTRACT_ID!,
    hitzTokenId: process.env.HITZ_TOKEN_ID!,
    xlmThreshold: 10,
    stellarNetwork: 'public',
    runInterval: 3600 // 1 hour
}

const bot = new TreasuryBot(config)
bot.run()
```

### Environment Variables

```bash
# .env
TREASURY_SECRET_KEY=S...  # Treasury wallet secret key (NOT admin key)
CORE_CONTRACT_ID=C...      # Core contract address
HITZ_TOKEN_ID=C...         # HITZ token contract address
XLM_THRESHOLD=10           # Min XLM to trigger distribution
RUN_INTERVAL=3600          # Seconds between cycles (1 hour)
STELLAR_NETWORK=public     # 'testnet' or 'public'
```

---

## Configuration

### Timing Strategy

| Interval | Pros | Cons | Use Case |
|----------|------|------|----------|
| **Every hour** | Smooth APR updates | Higher fees | Active platform |
| **Every 6 hours** | Balanced | - | Medium activity |
| **Daily** | Lower fees | Spiky APR | Low activity or testing |
| **Weekly** | Lowest fees | Very spiky APR | Very low activity |

**Recommendation**: Start with daily, adjust based on activity level.

### Threshold Strategy

| Threshold | Impact |
|-----------|--------|
| **Low (5 XLM)** | More frequent distributions, smoother APR |
| **Medium (10-20 XLM)** | Balanced between frequency and efficiency |
| **High (50+ XLM)** | Less frequent, but larger distributions |

**Recommendation**: Set threshold to cover ~1 day of typical fee volume.

### DEX Strategy

**Option 1: Market Orders**
- Immediate execution
- May experience slippage
- Good for high liquidity

**Option 2: Limit Orders**
- Better price control
- May not fill immediately
- Requires managing unfilled orders

**Option 3: Path Payments**
- Finds best conversion path
- Built-in slippage protection
- Recommended for most cases

---

## Monitoring

### Key Metrics to Track

1. **XLM Collection Rate**
   - XLM accumulated per day
   - Trends over time
   - Correlates with platform activity

2. **Conversion Rate (XLM/HITZ)**
   - Price paid for HITZ
   - Compare to market price
   - Track slippage

3. **Distribution Amount**
   - HITZ distributed per cycle
   - Total distributed to date
   - Percentage of max supply released

4. **Entry Distribution**
   - How HITZ is split among entries
   - Which entries receive most rewards
   - Correlation with engagement metrics

5. **Bot Health**
   - Uptime percentage
   - Failed cycles
   - Error rates

### Logging

```typescript
// Structured logging example
logger.info({
    event: 'cycle_start',
    xlm_balance: xlmBalance,
    threshold: config.xlmThreshold
})

logger.info({
    event: 'hitz_purchased',
    xlm_spent: xlmAmount,
    hitz_received: hitzBought,
    price: xlmAmount / hitzBought,
    timestamp: Date.now()
})

logger.info({
    event: 'distribution_complete',
    hitz_distributed: hitzAmount,
    entries_updated: result.entriesUpdated,
    largest_recipient: result.topEntry,
    timestamp: Date.now()
})
```

### Alerts

Set up alerts for:
- Bot crashes or stops running
- Failed cycles
- Low HITZ liquidity on DEX
- Abnormal conversion rates
- Treasury wallet balance too low

---

## Distribution Algorithm (Contract-Side)

While the bot only calls `distribute_rewards()`, understanding the contract's distribution logic is important:

```rust
// Simplified contract logic
pub fn distribute_rewards(e: Env, caller: Address, hitz_amount: i128) {
    // 1. Verify caller
    caller.require_auth();
    let treasury = get_treasury(&e);
    if caller != treasury {
        panic!("Only Treasury can distribute");
    }
    
    // 2. Transfer HITZ from Treasury to contract
    let hitz_client = TokenClient::new(&e, &get_hitz_token(&e));
    hitz_client.transfer(&caller, &e.current_contract_address(), &hitz_amount);
    
    // 3. Calculate total escrow
    let entry_ids = get_all_entry_ids(&e);
    let mut total_escrow: i128 = 0;
    for id in &entry_ids {
        let entry = get_entry(&e, id);
        total_escrow += entry.escrow_xlm;
    }
    
    if total_escrow == 0 {
        panic!("No escrow to distribute to");
    }
    
    // 4. Distribute proportionally
    for id in &entry_ids {
        let mut entry = get_entry(&e, id);
        
        if entry.escrow_xlm > 0 {
            // Proportional share
            let share = (entry.escrow_xlm * hitz_amount) / total_escrow;
            entry.reward_pool += share;
            
            // Recalculate APR
            entry.apr = calculate_apr(&e, &entry);
            
            // Save
            set_entry(&e, id, &entry);
        }
    }
}
```

### Distribution Example

```
Scenario:
- Treasury bot distributes 1000 HITZ
- Entry A: 500 XLM escrow (50%)
- Entry B: 300 XLM escrow (30%)
- Entry C: 200 XLM escrow (20%)
- Total: 1000 XLM escrow

Distribution:
- Entry A: (500 / 1000) × 1000 = 500 HITZ
- Entry B: (300 / 1000) × 1000 = 300 HITZ
- Entry C: (200 / 1000) × 1000 = 200 HITZ

Result:
- Entries with more engagement get more rewards
- Stakers in popular entries earn more
- Creates incentive for quality content
```

---

## Error Handling

### Common Issues

**1. Insufficient XLM Balance**
```typescript
if (xlmBalance < xlmThreshold) {
    logger.info('Balance below threshold, skipping')
    return
}
```

**2. DEX Liquidity Issues**
```typescript
try {
    const hitzBought = await buyHitz(xlmAmount)
} catch (error) {
    if (error.code === 'INSUFFICIENT_LIQUIDITY') {
        logger.warn('Low HITZ liquidity, reducing amount')
        // Retry with smaller amount
        return await buyHitz(xlmAmount * 0.5)
    }
    throw error
}
```

**3. Contract Call Failures**
```typescript
try {
    await distributeRewards(hitzAmount)
} catch (error) {
    logger.error('Distribution failed', { error, hitzAmount })
    // HITZ is still in Treasury wallet, can retry
    throw error
}
```

**4. Network Issues**
```typescript
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3
): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn()
        } catch (error) {
            if (i === maxRetries - 1) throw error
            await sleep(Math.pow(2, i) * 1000) // Exponential backoff
        }
    }
    throw new Error('Should not reach here')
}

// Usage
const result = await retryWithBackoff(() => 
    coreContract.distribute_rewards(...)
)
```

---

## Testing

### Testnet Setup

1. Deploy contracts to testnet
2. Create Treasury wallet
3. Fund Treasury with testnet XLM
4. Create HITZ/XLM trading pair on testnet DEX
5. Run bot with short interval (e.g., 5 minutes)

### Test Scenarios

**Scenario 1: First Distribution**
```
1. Create test entries with escrow
2. Fund Treasury with 10 XLM
3. Run bot cycle
4. Verify HITZ distributed proportionally
5. Check entry reward pools updated
6. Verify APRs calculated correctly
```

**Scenario 2: Multiple Cycles**
```
1. Run bot for 24 hours
2. Add new entries during period
3. Verify distribution adapts to new entries
4. Check cumulative reward pools grow correctly
```

**Scenario 3: Edge Cases**
```
1. Test with 1 entry only
2. Test with 100+ entries
3. Test with entries with 0 escrow
4. Test with very small HITZ amounts
5. Test with Treasury balance exactly at threshold
```

---

## Deployment

### Prerequisites

- Treasury wallet created and funded
- Treasury address registered in Core contract
- HITZ/XLM trading pair on DEX (or liquidity pool)
- Server/VM to run bot
- Monitoring and alerting setup

### Deployment Steps

1. **Set up environment**
   ```bash
   export TREASURY_SECRET_KEY=S...
   export CORE_CONTRACT_ID=C...
   export HITZ_TOKEN_ID=C...
   ```

2. **Test configuration**
   ```bash
   npm run treasury-bot:test
   ```

3. **Deploy to production**
   ```bash
   npm run treasury-bot:start
   ```

4. **Verify first cycle**
   - Check logs for successful cycle
   - Verify HITZ distributed
   - Check entry reward pools
   - Monitor for errors

### Production Checklist

- [ ] Treasury wallet funded with sufficient XLM
- [ ] Treasury address matches Core contract configuration
- [ ] Bot has network access to Stellar
- [ ] Logging configured and working
- [ ] Alerts configured
- [ ] Backup plan if bot goes down
- [ ] Manual distribution procedure documented
- [ ] Team knows how to restart bot

---

## Manual Operations

### Manual Distribution

If bot is down or for special circumstances:

```typescript
// One-time manual distribution
import { Keypair, Contract } from '@stellar/stellar-sdk'

const treasuryKeypair = Keypair.fromSecret(process.env.TREASURY_SECRET_KEY!)
const coreContract = new Contract(process.env.CORE_CONTRACT_ID!)

// Amount in HITZ
const amount = 1000

await coreContract.distribute_rewards({
    caller: treasuryKeypair.publicKey(),
    hitz_amount: BigInt(amount * 10_000_000)
}, {
    signer: treasuryKeypair
})

console.log(`Manually distributed ${amount} HITZ`)
```

### Allocate to Specific Entry

For promotions or special events:

```typescript
// Admin manually allocates rewards to specific entry
const adminKeypair = Keypair.fromSecret(process.env.ADMIN_SECRET_KEY!)
const coreContract = new Contract(process.env.CORE_CONTRACT_ID!)

await coreContract.allocate_rewards({
    entry_id: 'QmXXX...',
    hitz_amount: BigInt(500 * 10_000_000) // 500 HITZ
}, {
    signer: adminKeypair
})

console.log('Allocated 500 HITZ to specific entry')
```

---

## Security

### Best Practices

1. **Separate Keys**
   - Never use admin keys in the bot
   - Treasury keys separate from admin keys
   - Rotate keys periodically

2. **Key Storage**
   - Use environment variables, not hardcoded
   - Use secrets management service (AWS Secrets Manager, etc.)
   - Never commit keys to git

3. **Monitoring**
   - Alert on unusual activity
   - Log all transactions
   - Monitor Treasury balance

4. **Limits**
   - Set max amount per distribution
   - Set max slippage on DEX trades
   - Implement rate limiting

### Attack Scenarios

**Scenario 1: Compromised Treasury Keys**
- **Risk**: Attacker can call `distribute_rewards()`
- **Impact**: Medium - distributes rewards early (benefits platform)
- **Mitigation**: Rotate keys, monitor for unusual distributions

**Scenario 2: MEV/Front-running**
- **Risk**: Bot's DEX trades could be front-run
- **Impact**: Low-Medium - worse conversion rate
- **Mitigation**: Use private transactions or limit orders

**Scenario 3: DEX Manipulation**
- **Risk**: Attacker manipulates HITZ price before bot trade
- **Impact**: Medium - bot pays more for HITZ
- **Mitigation**: Set reasonable slippage limits, use TWAP pricing

---

## FAQ

**Q: How often should the bot run?**
A: Start with daily cycles. Adjust based on activity level. More active platforms benefit from more frequent distributions.

**Q: What if the bot crashes?**
A: XLM accumulates in Treasury wallet. When bot restarts, it will distribute the accumulated amount. No funds are lost.

**Q: Can we manually distribute if needed?**
A: Yes, anyone with Treasury keys can call `distribute_rewards()`. Admin can also use `allocate_rewards()` for specific entries.

**Q: What happens if HITZ liquidity is low?**
A: Bot should have slippage protection. If trade can't execute within limits, it will fail and retry next cycle.

**Q: How do we know the bot is working?**
A: Monitor logs, check Treasury balance decreasing, verify entry reward pools growing, track entry APRs.

**Q: Can we change the distribution algorithm?**
A: Yes, but requires upgrading the Core contract (admin operation). Bot doesn't need to change.

**Q: What if we want to pause distributions?**
A: Simply stop the bot. You can restart it anytime. Alternatively, don't fund the Treasury wallet.

---

## Summary

The Treasury Bot is a simple but critical component:

**What it does**:
- Converts XLM fees to HITZ rewards
- Calls Core contract to distribute

**What it doesn't do**:
- Make distribution decisions (contract does this)
- Have admin powers
- Directly interact with entries

**Key Benefits**:
- Automates reward distribution
- Keeps admin keys safe in cold storage
- Simple, reliable, easy to monitor
- Can be manually operated if needed

**Next Steps**:
1. Deploy contracts and set up Treasury wallet
2. Test bot on testnet
3. Deploy to production with monitoring
4. Monitor and adjust timing/thresholds as needed


