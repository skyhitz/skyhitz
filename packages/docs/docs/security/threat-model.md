---
id: threat-model
title: STRIDE Threat Model
sidebar_label: Threat Model
---

# STRIDE Threat Model: Skyhitz Platform

**Document Version:** 1.0  
**Date:** October 15, 2025  
**Status:** Active  

---

## Executive Summary

This document presents a comprehensive STRIDE threat model analysis for the Skyhitz platform, a decentralized music streaming and investment platform built on the Stellar blockchain. The analysis identifies 35 distinct threats across six categories and provides 120+ specific remediations to address security concerns in authentication, smart contract operations, data handling, and system availability.

**Key Findings:**
- 7 Critical priority remediations (2 already implemented ✅)
- 13 High priority remediations for near-term implementation  
- Multiple medium priority enhancements for defense-in-depth
- Comprehensive audit trail and monitoring recommendations

**Already Implemented:**
- ✅ All secrets stored in Cloudflare Workers Secrets
- ✅ Cold storage for treasury funds
- ✅ Webhook signature verification
- ✅ Public key ownership verification

---

## What Are We Working On?

### Project Description

Skyhitz is a decentralized music streaming and investment platform built on the Stellar blockchain. The platform enables users to:

- **Discover and stream music** from various sources (platform entries, Audius, Sound.xyz)
- **Earn HITZ tokens** through engagement (streaming, liking, downloading, mining)
- **Invest in music entries** through token staking with proportional ownership
- **Claim rewards** from entry reward pools based on stake ownership
- **Purchase credits** using traditional payment methods (Stripe)

The system uses a **post-exhaustion distribution model**:
- **21 million HITZ max supply** (fully issued ~20M)
- **HITZ-only economy** (all fees and staking in HITZ)
- **1:1 staking** (fee = stake, no oracle dependency)
- **Rate-limited distribution** (0.05% of treasury daily)
- **12-year emission curve** (Bitcoin-like sustainability)

### Technology Stack

**Frontend Layer:**
- Next.js 15 (React 19) for web application
- React Native/Expo for mobile application
- TailwindCSS for styling
- Deployed on Cloudflare Pages (OpenNext)

**API Layer:**
- Cloudflare Workers (serverless runtime)
- Apollo Server (GraphQL)
- JWT authentication
- Deployed globally on Cloudflare edge network

**Blockchain Layer:**
- Stellar Network (Mainnet/Testnet)
- Soroban Smart Contracts (Rust)
  - HITZ Token (Stellar Asset Contract / SAC)
  - Skyhitz Core Contract (actions, staking, rewards)
- Stellar RPC (Gateway RPC recommended)
- **Post-Exhaustion Mode**: No minting, distribution only

**Data Storage:**
- Algolia (user data, entry metadata, search index)
- Cloudflare R2 (media files, images, audio)

**External Services:**
- Stripe (payment processing)
- Kraken (XLM purchase/exchange)
- Postmark (email delivery)
- Audius (external music search)
- Sound.xyz (external music search)

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         User (Web/Mobile Client)                        │
│                      Authentication: JWT Bearer Token                   │
└────────────────┬──────────────────────────────────┬─────────────────────┘
                 │                                  │
                 │ HTTPS/GraphQL                    │ HTTPS
                 │                                  │
                 ▼                                  ▼
┌─────────────────────────────────┐    ┌──────────────────────────┐
│   Cloudflare Workers (API)      │    │   Stripe Payment API     │
│   - GraphQL Endpoint             │    │   - Payment Processing   │
│   - JWT Verification             │    │   - Webhook Events       │
│   - Request Validation           │    └──────────┬───────────────┘
│   - Rate Limiting                │               │
└────────┬────────────┬────────────┘               │ Webhook (verified)
         │            │                            │
         │            │ RPC Calls                  ▼
         │            │                   ┌─────────────────┐
         │            ▼                   │ Kraken Exchange │
         │   ┌─────────────────────┐     
         │   │ Stellar Soroban     │     ┌─────────────────┐
         │   │ Smart Contracts     │     │ Treasury Bot    │
         │   │                     │     │ (Rate-Limited)  │
         │   │ ┌─────────────────┐ │     │ - 0.05%/day     │
         │   │ │ HITZ Token      │◄──────┤ - No swapping   │
         │   │ │ (SAC)           │ │     │ - Distribution  │
         │   │ │ - Fixed Supply  │ │     └─────────────────┘
         │   │ │ - No Minting    │ │     
         │   │ └─────────────────┘ │     
         │   │                     │
         │   │ ┌─────────────────┐ │
         │   │ │ Skyhitz Core    │ │
         │   │ │ - recordAction  │ │
         │   │ │ - 1:1 Staking   │ │
         │   │ │ - Rewards       │ │
         │   │ │ - Artist Equity │ │
         │   │ └─────────────────┘ │
         │   └─────────────────────┘
         │
         ├──────► Algolia (encrypted data)
         │        - User Data
         │        - Entry Metadata
         │        - Search Index
         │
         ├──────► Cloudflare R2
         │        - Audio Files
         │        - Images
         │
         └──────► Postmark
                  - Passwordless Auth Emails
                  - Transaction Notifications
```

### Critical Data Flows

#### 1. User Authentication Flow
```
User → Email/Username → API (createUserWithEmail) → Generate Managed Wallet
→ Store Encrypted Seed in Algolia → Return Public Key → User Signs XDR
→ API Verifies Signature → Create Stellar Account → Send Magic Link (Postmark)
→ User Clicks Link → API (signInWithToken) → Generate JWT → Return to Client
```

#### 2. Investment Flow (V2 Post-Exhaustion)
```
User → investEntry(id, amount) → API Validates → Contract recordAction(invest)
→ Transfer HITZ to Contract (1:1 stake) → Record User Stake
→ Update Entry TVL → Return Success → Update Algolia Shares

Note: No minting - user's HITZ fee IS their stake (1:1 ratio)
No oracle dependency - stake = fee paid
```

#### 3. Treasury Bot Flow (V2 - Rate-Limited Distribution)
```
Cron Trigger (Daily) → Treasury Bot → Check Treasury HITZ Balance
→ Calculate 0.05% of Balance (Bitcoin-like rate limiting)
→ Call Contract.distribute_rewards_batch() (3-phase)
  Phase 1: Calculate total escrow
  Phase 2: Transfer HITZ to contract
  Phase 3: Distribute proportionally by escrow
→ Sync APRs to Algolia → Log Results

Note: No XLM→HITZ swaps needed - treasury holds HITZ directly
Rate-limited to 0.05% daily for 12-year sustainability
```

---

## STRIDE Framework Overview

| Mnemonic | Threat | Definition | Question |
|----------|--------|------------|----------|
| **S** | Spoofing | The ability to impersonate another user or system component to gain unauthorized access. | Is the user who they say they are? |
| **T** | Tampering | Unauthorized alteration of data or code. | Has the data or code been modified in some way? |
| **R** | Repudiation | The ability for a system or user to deny having taken a certain action. | Is there enough data to "prove" the user took the action if they were to deny it? |
| **I** | Information Disclosure | The over-sharing of data expected to be kept private. | Is there anywhere where excessive data is being shared or controls are not properly in place to protect private information? |
| **D** | Denial of Service | The ability for an attacker to negatively affect the availability of a system. | Can someone, without authorization, impact the availability of the service or business? |
| **E** | Elevation of Privilege | The ability for an attacker to gain additional privileges and roles beyond what they initially were granted. | Are there ways for a user, without proper authentication and authorization, to gain access to additional privileges? |

---

## Threat Summary by Category

### Spoofing Threats (5 identified)
- JWT token forgery and session hijacking
- Stripe webhook spoofing ✅ *Mitigated*
- Public key hijacking ✅ *Mitigated*
- Magic link interception
- Treasury bot impersonation

### Tampering Threats (6 identified)
- Transaction XDR manipulation
- Smart contract upgrade tampering
- Algolia data tampering
- RPC man-in-the-middle attacks
- Entry merge exploitation
- External metadata tampering

### Repudiation Threats (5 identified)
- User action denial
- Treasury bot operation disputes
- Admin action accountability gaps
- Payment processing disputes
- Earnings claim disputes

### Information Disclosure Threats (7 identified)
- JWT token exposure in client storage
- Encrypted seed exposure ✅ *Secured in Workers Secrets*
- Treasury strategy disclosure
- Algolia data exposure
- GraphQL introspection exposure
- Transaction pattern leakage
- Environment secret exposure ✅ *All in Workers Secrets*

### Denial of Service Threats (7 identified)
- Action spam attacks
- Account creation spam
- Storage exhaustion
- GraphQL query exhaustion
- Contract state bloat
- Treasury bot disruption
- RPC rate limit exhaustion

### Elevation of Privilege Threats (7 identified)
- Admin account compromise
- Token supply manipulation ✅ *Eliminated (supply exhausted, no minting)*
- Algolia admin key compromise
- ISSUER_SEED exposure ✅ *Secured in Workers Secrets & Cold Storage*
- Entry merge exploitation
- Cache poisoning
- Missing authorization checks

---

## Priority Remediations

### 🔴 Critical Priority (1 month)

| Status | Remediation | Threat | Effort |
|--------|-------------|--------|--------|
| ✅ | Store all secrets in Workers Secrets | Info.7, Elevation.4 | *Done* |
| ✅ | Cold storage for treasury funds | Elevation.4 | *Done* |
| 🔲 | Multi-sig for admin account | Elevation.1 | 1 week |
| 🔲 | Hardware wallets for admin keys | Elevation.1 | 2 days |
| 🔲 | Multi-sig for contract upgrades | Tamper.2 | 1 week |
| 🔲 | Encryption key rotation procedure | Info.2 | 1 week |

### 🟠 High Priority (3 months)

| Status | Remediation | Threat | Effort |
|--------|-------------|--------|--------|
| 🔲 | JWT rotation & short-lived tokens | Spoof.1 | 1 week |
| 🔲 | Move JWT to httpOnly cookies | Info.1 | 3 days |
| 🔲 | GraphQL query complexity limits | DoS.4 | 2 days |
| 🔲 | Cloudflare rate limiting at edge | DoS.4 | 1 day |
| 🔲 | Audit all mutations for authorization | Elevation.7 | 1 week |
| 🔲 | Disable GraphQL introspection in prod | Info.5 | 1 hour |
| 🔲 | Timelock for contract upgrades | Tamper.2 | 1 week |
| 🔲 | Public treasury dashboard | Repudiate.2 | 1 week |

### 🟡 Medium Priority (6 months)

- Rate limiting on all critical endpoints
- Comprehensive audit logging
- Monitoring & alerting for anomalies
- Data integrity verification
- CAPTCHA for suspicious activity
- Content fingerprinting for audio

---

## Detailed Threat Analysis & Remediations

### Spoofing Threats

#### Spoof.1: JWT Token Forgery
**Impact:** Critical - Complete account takeover, fund theft  
**Likelihood:** Medium

**Current State:**
- JWT tokens signed with JWT_SECRET ✅ *Stored in Workers Secrets*
- Token includes user ID, email, version
- Version tracking for invalidation

**Remediations:**
1. Implement short-lived JWT tokens (1-4 hours) with refresh token rotation
2. Store tokens in httpOnly cookies instead of localStorage
3. Add device fingerprinting for anomaly detection
4. Implement IP-based rate limiting on authentication

#### Spoof.2: Stripe Webhook Spoofing ✅ Mitigated
**Impact:** High - Free credits, financial loss  
**Likelihood:** Low

**Current State:** ✅ **Implemented**
- Webhook signature verification using `STRIPE_WEBHOOK_SECRET`
- Implementation: `stripe.webhooks.constructEventAsync(body, sig, webhookSecret)`

**Additional Recommendations:**
- Add idempotency checks using payment intent IDs
- Store processed payment IDs in Algolia to prevent replay

#### Spoof.3: Public Key Hijacking ✅ Mitigated
**Impact:** High - Identity theft  
**Likelihood:** Low

**Current State:** ✅ **Implemented**
- Check for existing publicKey in `getByUsernameOrEmailOrPublicKey()`
- Require signature verification via `verifySourceSignatureOnXDR()`

**Additional Recommendations:**
- Consider making signedXDR mandatory (remove optional parameter)

#### Spoof.4: Magic Link Interception
**Impact:** High - Account takeover  
**Likelihood:** Medium

**Remediations:**
1. Implement 15-minute expiration on passwordless tokens
2. Rate limit token generation (3 per email per hour)
3. One-time use tokens (already implemented via `invalidateUser()`) ✅
4. Add device/location verification for suspicious logins

#### Spoof.5: Treasury Bot Impersonation
**Impact:** High - Platform fund manipulation  
**Likelihood:** Low

**Remediations:**
1. Restrict bot execution to authenticated admin addresses
2. Use Cloudflare Workers Cron Triggers with secret validation
3. Implement multi-sig for treasury operations
4. Log all treasury bot executions with timestamps and tx hashes

---

### Tampering Threats

#### Tamper.1: Transaction XDR Manipulation
**Impact:** Critical - Fund theft, data corruption  
**Likelihood:** Low

**Remediations:**
1. Validate all XDR parameters before submission (amounts, destinations)
2. Client-side signing only for user wallets
3. For managed wallets: decrypt, sign, re-encrypt in memory only
4. Add transaction checksums in memo field

#### Tamper.2: Smart Contract Upgrade Tampering
**Impact:** Critical - Complete platform compromise  
**Likelihood:** Low

**Remediations:**
1. **Multi-signature for upgrades** (2-of-3 or 3-of-5)
2. **Timelock delays** (24-72 hours) before upgrades take effect
3. **Hardware wallet storage** for admin keys (Ledger/Trezor)
4. **Public announcement** of upgrades 72 hours in advance
5. **External audit** required before any upgrade
6. **Community governance** for major changes

#### Tamper.3: Algolia Data Tampering
**Impact:** High - Data integrity loss  
**Likelihood:** Medium

**Remediations:**
1. Separate API keys for read vs write operations
2. IP allowlisting for write operations
3. Cross-verify critical data against blockchain state
4. Implement data integrity checksums for sensitive records
5. Quarterly key rotation

#### Tamper.4: RPC Man-in-the-Middle
**Impact:** High - Transaction manipulation  
**Likelihood:** Low

**Remediations:**
1. Use Gateway RPC: `https://soroban-rpc.mainnet.stellar.gateway.fm:443`
2. Implement TLS certificate pinning
3. Validate transaction responses against expected values
4. Verify transaction hash matches submitted transaction

---

### Repudiation Threats

#### Repudiate.1: User Action Denial
**Impact:** Medium - Dispute resolution difficulty  
**Likelihood:** Medium

**Remediations:**
1. **Emit contract events** for all user actions
   ```rust
   event RecordAction {
       user: Address,
       entry_id: BytesN<32>,
       kind: Symbol,
       amount: i128,
       timestamp: u64
   }
   ```
2. Log critical mutations with: userId, timestamp, IP, user-agent
3. Client-side confirmation UI before signing transactions

#### Repudiate.2: Treasury Bot Disputes
**Impact:** High - Trust issues, regulatory risk  
**Likelihood:** High

**Remediations:**
1. **Comprehensive logging** for each bot operation
2. Store transaction hashes in Algolia: `treasury_operations` index
3. **Public dashboard** showing:
   - Total XLM collected
   - HITZ purchased and distributed
   - Prices and timestamps
   - Links to Stellar Explorer
4. Weekly reconciliation reports

#### Repudiate.3: Admin Action Accountability
**Impact:** High - Governance transparency  
**Likelihood:** Medium

**Remediations:**
1. Emit events for all admin actions:
   ```rust
   event AdminAction {
       admin: Address,
       action: Symbol,
       old_value: i128,
       new_value: i128,
       timestamp: u64
   }
   ```
2. On-chain governance voting for major parameter changes
3. Public audit trail of all administrative operations

---

### Information Disclosure Threats

#### Info.1: JWT Token Exposure
**Impact:** High - Session hijacking  
**Likelihood:** High

**Remediations:**
1. **Store in httpOnly cookies** instead of localStorage
   ```typescript
   Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
   ```
2. Short-lived access tokens (1 hour)
3. Separate refresh tokens (30 days, httpOnly)
4. Automatic token rotation

#### Info.2: Encrypted Seed Exposure ✅ Secured
**Impact:** Critical - Complete wallet theft  
**Likelihood:** Low

**Current State:** ✅ **Secured**
- Encryption key stored in Workers Secrets
- Seeds encrypted before storage in Algolia

**Additional Recommendations:**
1. Implement quarterly key rotation
2. Envelope encryption with per-user DEK
3. Provide key export for user migration to self-custody
4. Audit secret access logs

#### Info.5: GraphQL Introspection
**Impact:** Medium - Attack surface exposure  
**Likelihood:** High

**Remediations:**
1. **Disable introspection in production:**
   ```typescript
   introspection: process.env.NODE_ENV !== 'production'
   ```
2. Implement persisted queries (allow-list known queries)
3. Require authentication for GraphQL playground

#### Info.7: Environment Secrets ✅ Secured
**Impact:** Critical - Platform compromise  
**Likelihood:** Low

**Current State:** ✅ **Implemented**
- All secrets in Cloudflare Workers Secrets:
  - `ISSUER_SEED` ✅
  - `JWT_SECRET` ✅
  - `ENCRYPTION_KEY` ✅
  - `STRIPE_SECRET_KEY` ✅
  - `ALGOLIA_ADMIN_KEY` ✅

**Best Practices Maintained:**
- Secrets encrypted at rest and in transit
- Separate secrets per environment (staging/prod)
- Access restricted to authorized admins only

---

### Denial of Service Threats

#### DoS.1: Action Spam
**Impact:** High - Platform unavailability  
**Likelihood:** Medium

**Remediations:**
1. Rate limit recordAction: 10 per minute per user
2. Exponential backoff for repeated actions
3. CAPTCHA after suspicious patterns
4. Minimum fee enforcement (already implemented: base_fee × difficulty)

#### DoS.4: GraphQL Query Exhaustion
**Impact:** High - API unavailability  
**Likelihood:** High

**Remediations:**
1. **Query complexity limits** (max 1000):
   ```typescript
   import { createComplexityLimitRule } from 'graphql-validation-complexity'
   validationRules: [createComplexityLimitRule(1000)]
   ```
2. **Depth restrictions** (max 5 levels)
3. **Result pagination** (max 100 items per page)
4. **Cloudflare rate limiting**: 100 req/min per IP

#### DoS.7: RPC Rate Limits
**Impact:** High - Transaction failures  
**Likelihood:** Medium

**Remediations:**
1. Implement request queuing with exponential backoff
2. Multiple RPC endpoints with failover:
   - Primary: Gateway RPC
   - Fallback: SDF RPC
3. Cache frequently accessed data (5-60 minute TTLs)

---

### Elevation of Privilege Threats

#### Elevation.1: Admin Account Compromise
**Impact:** Critical - Complete platform compromise  
**Likelihood:** Low

**Remediations:**
1. **Multi-signature wallet** (2-of-3 minimum)
2. **Hardware wallets** for all admin keys (Ledger/Trezor)
3. **RBAC implementation:**
   - Super Admin: contract upgrades, treasury
   - Contract Admin: parameter changes
   - Support: user assistance only
4. Monitor and alert on all admin actions
5. External audit before any upgrade

#### Elevation.4: ISSUER_SEED Exposure ✅ Secured
**Impact:** Critical - Complete platform control  
**Likelihood:** Low

**Current State:** ✅ **Implemented**
- ISSUER_SEED stored in Workers Secrets
- Cold storage for majority of treasury funds
- Hot wallet contains only operational funds

**Best Practices Maintained:**
- Multi-sig for treasury operations (recommended)
- Time-delayed withdrawals for large amounts
- Regular security audits

#### Elevation.7: Missing Authorization Checks
**Impact:** High - Data manipulation  
**Likelihood:** Medium

**Remediations:**
1. **Audit all mutations** for `requireAuth(context)` calls
2. **Resource ownership validation:**
   ```typescript
   if (entry.creatorId !== context.user.id && !context.user.isAdmin) {
     throw new Error('Unauthorized')
   }
   ```
3. **Integration tests** for authorization bypass scenarios
4. Security-focused code review process

---

## Implementation Roadmap

### Phase 1: Authentication & Authorization (Months 1-2)
**Goal**: Harden auth and eliminate privilege escalation

- [ ] JWT improvements (short-lived, httpOnly cookies)
- [ ] Authorization audit of all mutations
- [ ] Integration tests for auth bypass
- [ ] GraphQL hardening (complexity, introspection)

**Deliverables:**
- Short-lived JWTs with refresh tokens
- All mutations have authorization checks
- Security test suite
- Hardened GraphQL endpoint

---

### Phase 2: Smart Contract Security (Month 3)
**Goal**: Protect critical contract operations

- [ ] Multi-sig admin account setup
- [ ] Hardware wallet deployment
- [ ] Timelock mechanism for upgrades
- [ ] Public announcement process

**Deliverables:**
- 2-of-3 multi-sig admin wallet
- Hardware wallets for all admin keys
- 72-hour timelock on upgrades
- Upgrade governance procedure

---

### Phase 3: Operational Security (Months 4-5)
**Goal**: Monitoring, logging, transparency

- [ ] Comprehensive audit logging
- [ ] Public treasury dashboard
- [ ] Monitoring & alerting setup
- [ ] Rate limiting on all endpoints
- [ ] Treasury bot authentication

**Deliverables:**
- Audit logs for all critical operations
- Public transparency dashboard
- Security monitoring dashboards
- Complete rate limiting implementation

---

### Phase 4: Validation (Month 6)
**Goal**: External validation and continuous improvement

- [ ] External security audit (contracts + API)
- [ ] Penetration testing
- [ ] Bug bounty program launch
- [ ] Security training for team

**Deliverables:**
- Security audit report
- Penetration test findings addressed
- Active bug bounty program
- Quarterly threat model review schedule

---

## Security Best Practices

### For Developers

1. **Never log sensitive data** (seeds, private keys, passwords)
2. **Always validate user input** before processing
3. **Use requireAuth()** for protected mutations
4. **Verify resource ownership** before modifications
5. **Emit events** for all state-changing operations
6. **Test authorization** in unit and integration tests

### For Admins

1. **Use hardware wallets** for all admin operations
2. **Never share private keys** or seeds
3. **Announce changes** 72 hours in advance
4. **Review audit logs** weekly
5. **Rotate secrets** quarterly
6. **Test in staging** before production changes

### For Users

1. **Enable 2FA** on email accounts (for magic links)
2. **Verify URLs** before entering credentials
3. **Report suspicious activity** immediately
4. **Keep browser updated** for latest security patches
5. **Use strong, unique passwords** for email accounts

---

## Monitoring & Alerting

### Critical Alerts (Immediate Response)

- Unusual admin activity (contract upgrade attempts, large transfers)
- Multiple failed authentication attempts (>10 per minute)
- Unexpected smart contract events (emergency admin actions)
- Treasury balance drops >20% unexpectedly (beyond 0.05% daily rate)
- Unexpected staking or unstaking patterns

### High Priority Alerts (1-hour response)

- GraphQL query errors >5% of requests
- RPC failures >10% of calls
- Unusual account creation rate (>100/hour)
- Payment processing failures
- Magic link generation rate exceeded

### Medium Priority Alerts (Daily review)

- Storage usage trends (approaching limits)
- Algolia operation costs increasing
- Treasury bot execution failures
- Entry merge operations

---

## Incident Response

### Security Incident Contacts

| Role | Responsibility |
|------|----------------|
| Security Lead | Overall incident coordination |
| Smart Contract Admin | Contract emergency actions |
| Infrastructure Admin | API/Worker emergency changes |
| External Auditor | Post-incident review |

### Incident Response Process

1. **Detect**: Automated monitoring alerts team
2. **Assess**: Determine severity and impact
3. **Contain**: Isolate affected systems, pause operations if needed
4. **Eradicate**: Remove threat, patch vulnerabilities
5. **Recover**: Restore normal operations, verify security
6. **Learn**: Post-mortem analysis, update threat model

---

## References

### Stellar Security Documentation
- [STRIDE Threat Model Template](https://developers.stellar.org/docs/build/security-docs/threat-modeling/STRIDE-template)
- [Threat Modeling How-To Guide](https://developers.stellar.org/docs/build/security-docs/threat-modeling/threat-modeling-how-to)
- [Securing Web-Based Projects](https://developers.stellar.org/docs/build/security-docs)

### Security Frameworks
- STRIDE Methodology (Microsoft)
- OWASP Top 10
- OWASP API Security Top 10
- CWE (Common Weakness Enumeration)

### Audit Resources
- [Stellar Audit Bank](https://stellar.org)
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/)
- [Soroban Security](https://soroban.stellar.org/)

### Internal Documentation
- [Smart Contract Security Audit](/operations/treasury-bot)
- [Deployment Procedures](/operations/deploy)
- [Stellar & Soroban Integration](/backend/stellar-soroban)

---

## Document Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-15 | Initial STRIDE threat model |
| 2.0 | 2026-01-10 | Updated for V2 post-exhaustion model |

**Key V2 Security Improvements:**
- Token supply manipulation eliminated (no minting)
- Oracle manipulation eliminated (1:1 staking)
- Rate-limited distribution (0.05% daily)

**Next Review Date:** April 10, 2026  
**Review Frequency:** Quarterly (or after major changes)  
**Document Owner:** Security Team

---

*This threat model is a living document and should be updated as the platform evolves, new threats emerge, or security improvements are implemented.*

