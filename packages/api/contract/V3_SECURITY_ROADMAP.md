# V3 Security Model Roadmap

## Overview
The V3 Security Model introduces anti-arbitrage protections to the Skyhitz staking system.

## Phase 1: 24-Hour Staking Timelock (PR #15)

### Problem: Atomic Batch Arbitrage
On the Stellar network, multiple operations can be bundled into a single atomic transaction. Without a timelock, an attacker could:
1. **Deposit** a large amount of capital
2. **Claim** rewards or manipulate state within the same transaction
3. **Withdraw** immediately with zero market exposure

This allows risk-free arbitrage that extracts value from the protocol.

### Solution: Time-Based Commitment
- Every stake deposit sets `unlock_time = now + 86400` (24 hours)
- `unstake()` enforces: if `now < unlock_time`, transaction panics
- Top-up deposits reset the timer for the entire position

### Security Properties
- **Intentionality**: Forces genuine capital commitment
- **Market Exposure**: 24 hours of price risk discourages hit-and-run attacks
- **Dusting Protection**: Timer resets prevent circumvention via tiny deposits

## Phase 2: Admin Recovery Tools (PR #16) - Planned
- `admin_set_total_minted()` for supply cap corrections
- `force_oracle_price()` for emergency price overrides

## Phase 3: Post-Exhaustion Enhancements (PR #17) - Planned
- Final economic model tuning for sustainability
