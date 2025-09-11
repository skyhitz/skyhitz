---
id: deploy
title: Deploy & Environments
---

API (Cloudflare Workers):

- Dev: `yarn api:dev`
- Deploy: `yarn api:deploy`

Web (Next.js on Cloudflare Pages):

- Dev: `yarn ui:dev:prod` (or env-specific variants)
- Cloudflare deploy: `yarn cf:deploy` (`:staging`, `:production`)

Docs:

- Local: `yarn docs:start`
- Build: `yarn docs:build` → serve `packages/docs/build`

Ensure environment variables are set for Workers (PostMark, R2, Stellar, Algolia, Stripe, etc.).


