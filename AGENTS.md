# AGENTS.md

Guidance for AI coding agents (Droid, Claude Code, and similar) working in this repository.

## What this repository is

Adyen's official LINK cartridge integrating Salesforce Commerce Cloud (SFCC) storefronts with the Adyen payment platform. Supports SFRA versions 5.x to 7.x and legacy SiteGenesis.

- Sources live in `src/cartridges/` and are transpiled with Babel into top-level `cartridges/` (gitignored build output). Edit code under `src/` only, never the transpiled output.
- Cartridges: `int_adyen_SFRA` (core payment logic: controllers, scripts, hooks), `app_adyen_SFRA` (SFRA storefront overrides), `bm_adyen` (Business Manager settings page), `int_adyen_webhooks` (Adyen notification/webhook handling), `int_custom_cartridge` (placeholder for merchant customizations, see README).
- Merchant customizations belong in `int_custom_cartridge`, not in Adyen default code.

## Verify your work

Run these commands and show the output; do not just claim the work is done:

- `pnpm lint` (ESLint over `src/`)
- `pnpm lint:isml` (ISML template lint)
- `pnpm test` (Jest unit tests over `src/`)

Do not run `pnpm build`, `pnpm upload`, `pnpm uploadCartridge`, or `pnpm watch`: they deploy to a live SFCC instance using `dw.json` credentials. `pnpm check-build:sfra` only validates an upload log after a manual upload.

## Hard rules

- Never log or expose cardholder data, full webhook payloads, or service credentials.
- Adyen notification requests must pass HMAC verification (`src/cartridges/int_adyen_webhooks/cartridge/checkNotificationAuth.js`) before anything trusts their contents or changes order/payment state.
- Locale changes must keep all locale `.properties` files consistent in the same change.
- Conventional Commits are enforced by commitlint (husky `commit-msg` hook).
- Branch names must match `feature|bugfix|improvement|library|prerelease|release|hotfix/<name>` (enforced by the `pre-commit` hook via `branching.sh`).
- Release flow: develop, then `release/x.y.z`, then PR to `main` with a tagged release. Reverting means reverting the merge commit; merchants pin the previous release tag.
- Git hooks run on commit: branch-name check, ESLint, and a log-statement check. Pre-push runs the full Jest suite.

## Reviewing changes

Before opening or reviewing a PR, load `REVIEW.md` at the repository root. It defines what failure looks like here, what to always check, and how to report findings.

## Non-goals

- Do not reformat or refactor unrelated code; match surrounding style.
- Do not add dependencies without a strong reason.
- Docs-only and metadata-only changes do not require unit tests.
