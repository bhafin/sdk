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
