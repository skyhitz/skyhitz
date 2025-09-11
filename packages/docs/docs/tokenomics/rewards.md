---
id: rewards
title: Rewards Overview
---

Skyhitz rewards accrue via on-chain variables maintained per entry and per user.

- TVL (Total Value Locked): total equity-bearing investments (stroops) across all users
- Escrow: total funds held by the contract for the entry (includes equity + earnings)
- APR: annualized rate derived on-chain from excess escrow over TVL
- Shares: user-specific equity (stroops); ownership = `shares / tvl`

Only investments strictly greater than 0.3 XLM grant shares. Micro-spends at or below 0.3 XLM (stream completion, like, download) do not grant shares but increase escrow, which can raise APR.

## Micro-spends vs. Investments

- Micro-spends (≤ 0.3 XLM): stream completion, like, download — increase escrow, no shares, may raise APR
- Investments (> 0.3 XLM): Invest or the equity half of Mine — increase escrow and TVL, grant shares proportionally to amount

## Actions

All spend/invest actions ultimately call the same contract function `invest(user, id, amount)` with different `amount` values (converted to stroops × 1e7). Whether you earn shares depends on the single-call amount compared to the 0.3 XLM threshold.

- Mine
  - Total cost: 1.0 XLM split by the APR math (see “APR Math & Mining Partition”)
  - Two contract invests: a micro-spend, inits escrow (≤ 0.3 XLM, no shares) and an equity invest (typically > 0.3 XLM, grants shares)
  - Also includes a fee payment to the contract admin (Skyhitz comission)

- Like
  - Micro-spend (≤ 0.3 XLM), increases escrow only
  - No shares are granted; can raise APR for all holders

- Download
  - Micro-spend (≤ 0.3 XLM) required before downloading
  - Increases escrow only; no shares

- Stream (completion)
  - Micro-spend (≤ 0.3 XLM) on track completion
  - Increases escrow only; no shares

- Invest
  - Any single invest amount strictly greater than 0.3 XLM grants shares and increases TVL.
  - Shares are dilutive: ownership is `your_shares / tvl`. When others invest (> 0.3 XLM), `tvl` grows and your percentage may decrease unless you also invest. Your absolute shares (stroops) never decrease; only the fraction can change as TVL expands.

- Creator Claim (not yet implemented in the app)
  - After manual verification, the creator can claim ownership of an entry.
  - Initial allocation: 25% of total shares at claim time.
  - Promotional boost: If they promote post‑claim (criteria to be published), their allocation increases to 50%.

- Creator Takedown (not yet implemented in the app)
  - After verification and a diligent process, an entry can be removed if necessary.
  - TVL (invested funds) will be returned to users pro‑rata; shares and APR for the removed entry cease to exist.

- Internal Mine / Mint
  - For exclusive collaborations initiated with Skyhitz. Creators can launch exclusives where the initial share split is agreed up‑front.
  - The exact initial percentage for creators is case‑by‑case and defined during the agreement phase.
  - To start the process, email ar@skyhitz.io (see landing page for more details).

## Claiming Earnings

Earnings are the surplus lumens that accumulate in contract escrow beyond the equity TVL. Holders claim based on their ownership fraction.

Terminology (per entry):

- Earnings pool: `max(escrow - tvl, 0)`
- User fraction: `user_shares / tvl` (computed in‑contract using 6‑decimal scaling)
- Previously withdrawn: `withdrawn_earnings[user]`
- Claimable amount: `user_fraction * earnings_pool - previously_withdrawn`

Flow:

1) Preview (read‑only): We expose a `claimableEarningsPreview` API that computes the same formula without invoking the contract, so the UI only enables “Claim” when the preview is > 0.
2) Invoke: When preview > 0, the app calls `claim_earnings(user, id)` on the Soroban contract.
3) Contract updates atomically:
   - Decreases `escrow` by `claimable`
   - Increases `withdrawn_earnings[user]` by `claimable`
   - Recomputes `apr`
   - Transfers `claimable` from contract to the user

Units & rounding:

- Contract uses stroops (`i128`); 1 XLM = 10,000,000 stroops
- Proportional math uses a scale constant (1_000_000) to reduce rounding error
- Client surfaces values in XLM with appropriate formatting

Example:

- tvl = 10.0 XLM, escrow = 12.0 XLM → earnings pool = 2.0 XLM
- user_shares = 2.5 XLM → user fraction = 2.5 / 10.0 = 25%
- previously_withdrawn = 0.4 XLM
- claimable = 25% × 2.0 − 0.4 = 0.1 XLM

Edge cases & FAQs:

- Why is claimable 0 even though escrow > tvl? You may have 0 shares, or your previously withdrawn amount equals your current entitlement.
- Does claiming change my shares? No. Claiming only decreases `escrow` and increases `withdrawn_earnings[user]`.
- Does claiming reduce APR? Often yes. Since APR is derived from `(escrow − tvl) / tvl`, paying out earnings lowers the numerator.
- Can I spam claim? You can call again, but the second call typically returns 0 until new earnings accrue.
