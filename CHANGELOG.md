# 0.9.0

Adds the public mutual fund → portfolio() → holdings() resource chain, selecting the latest stored portfolio by default and retaining historical month-start selection. Holdings pagination binds to the selected portfolio; AUM stays on that record. Existing mix methods remain compatible. Strengthens calendar and union validation, pagination guards, and constructor transport snapshots.

# 0.8.0

Adds fund-owned stored AUM, including AUM inside public fund portfolio and holdings responses. TER is unchanged. Also adds account-independent stored index discovery/performance and fund-owned benchmark composition/performance, with scheme delegation. Uses existing stored quotes and weights; supports 1y/3y/5y with explicit missing-data results. These additive methods require the matching server API and baseline API-key access without account or portfolio permissions. See [benchmark guide](docs/benchmarks.md).

# 0.7.0 — 31 October 2026

Added baseline scheme performance, category statistics, instrument references and caller-supplied scheme valuation. Existing pure-market methods remain compatible. Private portfolio authorization is unchanged. Matching API permission correction deployed in revision 10.

# Changelog

## 0.6.0

Add `markets.schemes.search` and compatible `BharosaMarket.schemes.search` using the canonical account-independent search route. Keep private search and historical methods unchanged. Correct the getting-started example to use an API key without a required account ID.


## 0.5.1

Documentation-only correction: use normal npm installation and released status, describe deployed unified-key/latest-NAV access, and remove stale preview wording. Runtime, public types, contracts and dependencies are unchanged from 0.5.0.

## 0.5.0 — 31 October 2026

Add `new Bharosa({ apiKey })` and `client.markets` for baseline market access. Support latest NAV by omitting the date on baseline and account-scoped NAV methods. Preserve existing auth forms, private authorization, production API origin and monthly limits on explicit historical dates.

## 0.4.0 — 30 October 2026

Add account-scoped Growth scheme performance and category return statistics. Preserve the api.bharosa.finance default introduced in 0.3.3 and explicit overrides. No investor monetary-performance, fund-AUM or stated-TER methods.

## 0.3.3 — 30 October 2026

Change the default API origin to https://api.bharosa.finance. No analytics changes.

## 0.3.2 — 30 October 2026

Default omitted or undefined `baseUrl` to `https://app.bharosa.finance` in Bharosa and BharosaMarket. Preserve explicit overrides, origin validation, redirect rejection and credential boundaries. Remove required origin setup from beginner examples. No analytics additions or API changes.

## 0.3.1 — 30 October 2026

Correct stale publication and activation wording in the README and portfolio guide. Runtime code, API contracts, exports and dependencies are byte-identical to 0.3.0.

## 0.3.0 — published 30 October 2026

Adds server-side BharosaMarket for four authenticated registered-app monthly market operations without an investor token or account argument. Production market-key support is active at app.bharosa.finance in the production environment. Includes the portfolio lifecycle changes below; no analytics additions or general OAuth provisioning.

## Lifecycle changes — included in 0.3.0 (0.2.0 was not published)

- Add `portfolios.update(id, { name, expected_name }, { idempotencyKey })` for account-scoped, name-only updates, with optimistic name comparison and validated response identity. Holdings and snapshots remain unchanged.
- Accept `positions: []` when creating a saved portfolio. Empty portfolio analysis remains unavailable until holdings exist.
- Clarify that monthly market reads require authenticated account-read access without a separate market-data approval.
- Preserve existing methods, exports, authentication, quantity precision, and analytics implementation. Requires a companion API with portfolio lifecycle support; package preparation does not establish production availability.

The entries below are archived preparation notes retained for provenance, not current installation or release instructions. Their historical “unreleased” and “pending” labels describe preparation at that time.

## 0.1.0 — published

Initial npm release. API deployment and external consent activation are separate.

- Typed Node.js client with ESM/CommonJS exports, account-scoped direct/delegated authentication, and 17 public resource operations.
- Portfolio asset, sector, and issuer mix methods for saved and in-memory targets, with MutualFund conveniences delegated to their underlying Portfolio.
- Object conveniences: `portfolios.build`, immutable readable in-memory positions, and saved `Portfolio.currentSnapshot`; `fromPositions` remains compatible. No additional HTTP endpoints.
- Typed errors, explicit mutation outcomes, bounded opt-in retries, total request deadlines, response validation, and browser rejection.
- MIT license for the SDK, standalone guides, synthetic examples, contributor tooling, and CI configuration. The API and analytics implementation remain separate and closed source.

## Unreleased — TypeScript source migration

- Author the client and behavioral tests in strict TypeScript and emit declarations from implementation.
- Preserve resource methods, runtime validation, caller-owned transport and CommonJS/ESM package entry points.
- Keep runtime dependencies empty; TypeScript and Node definitions are development-only tooling.

Units-first portfolio creation (local, unreleased): `portfolios.create` accepts an initial position with either `current_value` or positive `quantity`, never both, using the supplied `as_of` date. Existing amount requests and amount-only responses remain unchanged. Supplied units are stored atomically without requiring a NAV. Snapshot `quantity` can now be a decimal string and `valuation` can be null; `total_current_value` is null when any snapshot position lacks a reported amount, and `valuation_basis` is `supplied_quantity`. Consumers of general snapshot reads must handle these new nullable values; this is an intentional prelaunch type widening. Older SDKs cannot read units-only snapshots. Snapshot replacement and in-memory analytics remain amount-only. No public package release or availability change is implied.

Unit precision follow-up (local, unreleased): supplied units accept at most four fractional digits; additional digits are rejected, never truncated. Dated amount conversion rounds once to four places using decimal half-even arithmetic; a positive amount rounding to zero returns `units_below_precision`. Currency and NAV precision are unchanged. Exact historical quantities and provenance remain in stored evidence and read responses; the web marks rounded displays with ≈, shows tiny positive values as <0.0001, and makes a rounded edit draft an explicit correction. Existing zero-unit closure remains supported; initial quantities must be positive. No portfolio reset or data rewrite is required. Canonical marketing reconciliation is coordinated through the parent, with deployment pending.

Local readiness: reject inconsistent resource pagination responses and discard late custom-transport bodies after cancellation. No operation shapes, credentials, access or availability changed.

Local attendee readiness: browser-condition ESM now selects the explicit ESM entry point; packed tests exercise both browser ESM and CJS. The installed archive includes a credential-free offline smoke script. README startup checks identify missing environment variable names without exposing values. No live endpoint, access or publication is implied.
