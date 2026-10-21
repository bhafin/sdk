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

## Dated positions and declared history

For a saved portfolio, `portfolio.holdings.list()` and `.retrieve(id)` return scoped holdings. `holding.positionOn("2026-01-10")` resolves exact observed evidence or opening quantity plus buy/sell transactions within a declared complete range. Value-only observations retain `quantity: null`. A later opening does not hide an earlier exact observation, and missing dates never inherit current quantities.

Use `portfolio.history.import(body, { idempotencyKey })` to import source-tagged history, `.retrieve()` to inspect it, and `.canReconstruct(date)` to check strict availability. Completeness is a source/user assertion, not independent verification or an inference from matching ending balances. Every stored holding, including closed holdings and separate folios, must be supported for a complete dated portfolio.

`portfolio.on(positionDate).assetMix({ valuationDate, asOf })` uses server-side reconstruction and calculation. The dated view also supports `sectorMix` and `issuerMix`. Position date, valuation date (defaulting to position date), and underlying composition cutoff (`asOf`) are independent. Exact-date provider NAV is required; missing prices fail explicitly. Existing `asOf` calls remain unchanged. Fund handles do not expose investor dated views; in-memory value-only positions cannot reconstruct earlier dates.

Opening quantities apply at start of day; transactions through daily close use explicit sequence order. The investment account owns the timezone (initial default Asia/Kolkata). Decimal strings support up to 20 whole digits and 18 fractional places. Imports are idempotent by scoped source/event identity; conflicting payloads fail. A declared range can extend forward with the same start, and transaction-only imports preserve its source. No acquisition history is invented from an opening balance. Unsupported transfers, splits, corrections, reversals, price imports, tax lots and performance calculations fail explicitly. These capabilities are local implementation, not a published service.


## Current holding entry

Saved portfolios expose `holdings.setCurrent(input, {idempotencyKey})` for the
first-party current-entry workflow. Input contains source (kind user/statement
and reference), and holdings with external_id, investment_account, instrument
and observed_position. The observation contains date and quantity and/or INR
current_value. Decimal values are strings.

Omitting quantity converts the supplied dated amount into units on the server
using NAV on/before that date. The result preserves original amount, position
date, actual NAV, and half-even rounding to 18 decimal places. Missing NAV fails
the write. Explicit units retain supplied provenance. This creates no purchases
or transaction-history completeness. Historical snapshot writes are unchanged.

Each returned holding has revision. To correct the latest observation on its
same date, include expected_revision matching that revision and use a new
idempotency key. A stale revision conflicts; prior evidence remains in audit
history. A genuinely later observation starts revision 1. Retry an unchanged
operation with its original key to receive its original receipt. Do not change
dates to bypass a conflict. Distinct folios remain separate; an incomplete set
of valuations must not be presented as a complete total.
