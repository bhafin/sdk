# Portfolios and mixes

A Portfolio object exposes `assetMix()`, `sectorMix()`, and `issuerMix()`. Each performs a separate read-only API request. The SDK does not calculate mixes locally.

## Saved portfolios

Retrieve a portfolio with `bharosa.portfolios.retrieve(id)`, then call its mix methods. Portfolios returned by list, create, and current/replacement snapshot operations expose the same methods. Methods do not add fields to serialized portfolio JSON.

Saved calculations use the current snapshot. An optional `{ asOf: "2026-10-18" }` selects the underlying holdings cutoff; it does not select an older saved snapshot. Use valid IDs from your deployment, not the fictional IDs in examples.

Saved portfolio objects also expose `currentSnapshot(requestOptions?)`, which delegates to the existing current-snapshot read. It returns the snapshot view, including a Portfolio object. This does not add an endpoint or bypass account authorization.

## In-memory portfolios

`bharosa.portfolios.build({ valuationDate, positions, currency: "INR" })` creates a local handle. Each position has an `instrument` ID and a decimal-string `current_value`. Calling a mix method sends the target to the API without saving a portfolio. Only supported India INR mutual-fund portfolios are accepted.

The handle exposes the supplied `positions` as a defensively copied, frozen collection with frozen entries. It is not a mutable persistence collection: create a new handle to change the supplied positions. `fromPositions(...)` remains an equivalent alias. Use `portfolios.create(...)` for persistence. Convenience properties and methods do not change serialized JSON fields.

See [portfolio-mixes.ts](../examples/portfolio-mixes.ts) for checked examples of saved and in-memory targets.

## Mutual funds

Use `mutualFunds.fromInstrument(instrumentId)` for an investible scheme instrument or `mutualFunds.fromId(mutualFundId)` for a portfolio-owning MutualFund ID. These identifiers are not interchangeable; a MutualFund owner ID is not an AMC ID.

Each fund handle has a `portfolio` calculation handle with all three mix methods. This handle is not a downloaded holdings collection. The same methods on the fund delegate to that portfolio. Instruments returned by fund search and reference lookup also expose these conveniences. Reference results identify missing instruments explicitly; match by ID rather than position.

## Read results faithfully

Asset percentages may be negative or greater than 100. Sector and issuer outputs are equity-only. Preserve returned dates, warnings, availability status, and precision metadata. An unavailable mix is different from an empty or zero allocation. Zero-net underlying data can produce an explicit API error.

The method signatures are `(params?, requestOptions?)`. Pass `{}` for params when you only need request options: `portfolio.assetMix({}, { timeoutMs: 10000, maxRetries: 1 })`. Mix requests need no idempotency key and create no saved state. Cancellation and timeouts still apply.
