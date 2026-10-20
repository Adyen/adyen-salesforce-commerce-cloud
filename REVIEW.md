# REVIEW.md

Guidance for reviewing changes in this repository, for AI reviewers and humans. Code owners maintain this file; move repeated review findings into it.

## What failure looks like

Failure means a broken payment or webhook flow in production, an order left in the wrong state, or sensitive data (cardholder data, credentials, full payloads) leaking. Style is not failure. If nothing fits this definition, say so plainly.

## Always check

- Webhook handling (`src/cartridges/int_adyen_webhooks/`: `notify.js`, `handleNotify.js`, `checkNotificationAuth.js`, `eventHandlers/`, `libs/libAuthenticationUtils.js`): HMAC verification runs before any state change, and a failed verification rejects the notification instead of logging and continuing.
- Amounts, currency, and gift card handling: math, rounding, formatting, and refusal messages that reach shoppers. Refusal messages must be localized for every supported locale.
- Locale completeness: every changed `.properties` file updated for all locales in the same change.
- ISML templates: user-controlled values escaped (XSS); no unescaped interpolation into scripts or attributes.
- Service calls and credentials: no secrets in logs, no request URLs built from user input.
- `hooks.json` (`src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/hooks.json`) and cartridge wiring: a missing or misnamed hook silently breaks checkout.
- `.github/workflows/` and release scripts: always require a human approval, regardless of automated results.

## How to report findings

- Every finding names a file and line, and states what breaks if it ships. No guessing from names.
- Tag each finding: Important, Nit, or Pre-existing (a bug the PR did not introduce).
- Cap nits at three per review. Do not report style-only, diagnostic-only, or cleanup-only findings.
- Start the summary with a count, for example "3 findings: 2 Important, 1 Nit", and say clearly when there is nothing to fix.
- After the first round, re-review only the new diff; do not repeat findings already answered. After three rounds, step back and reconsider the approach instead of iterating further.

## Paths to skip

- `cartridges/` (transpiled build output of `src/`; review the source instead)
- `node_modules/`, `coverage/`, and `metadata/` unless the PR intentionally changes them

## Known regression patterns

One line per production incident or revert, with the ticket ID. Check these before approving anything touching the same area:

- SFI-1728: gift card refusal messages not localized. Anything touching refusal message handling must cover all locales.
