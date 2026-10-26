# Changelog

## Unreleased

Local development only. No npm release or public API deployment is claimed.

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
