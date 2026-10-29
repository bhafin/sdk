# Portfolios and mixes

A `Portfolio` object exposes `assetMix()`, `sectorMix()`, and `issuerMix()`. Each performs a separate read-only API request. The SDK does not calculate mixes locally.

## Saved portfolios

Retrieve a portfolio with `bharosa.portfolios.retrieve(id)`, then call its mix methods. Portfolios returned by list, create, and current/replacement snapshot operations expose the same methods. Methods do not add fields to serialized portfolio JSON.

Saved calculations use the current snapshot. An optional `{ asOf: "2026-10-01" }` selects the underlying holdings cutoff; it does not select an older saved snapshot. Get portfolio IDs from `portfolios.list()`. Filter the returned portfolios by the selected investor ID; there is no unique current-portfolio property. Follow pagination before offering a complete list.

Saved portfolio objects also expose `currentSnapshot(requestOptions?)`, which delegates to the existing current-snapshot read. It returns the snapshot view, including a `Portfolio` object. The response includes the snapshot date and recorded amounts. It does not automatically revalue current holdings at the latest NAV.

## In-memory portfolios

`bharosa.portfolios.build({ valuationDate, positions, currency: "INR" })` creates a local handle. First call `mutualFunds.search({ query })` and let the user select the intended fund and plan; use the selected result’s `instrument.id`. Each position has an `instrument` ID and a decimal-string `current_value`. Calling a mix method sends the target to the API without saving a portfolio. Only supported India INR mutual-fund portfolios are accepted.

The handle exposes the supplied `positions` as a defensively copied, frozen collection with frozen entries. It is not a mutable persistence collection: create a new handle to change the supplied positions. `fromPositions(...)` remains an equivalent alias. Use `portfolios.create(...)` for persistence. Convenience properties and methods do not change serialized JSON fields.

See [portfolio-mixes.ts](../examples/portfolio-mixes.ts) for checked examples of saved and in-memory targets.

## Mutual funds

Use `mutualFunds.fromInstrument(instrumentId)` for an investible scheme instrument or `mutualFunds.fromId(mutualFundId)` for a portfolio-owning MutualFund ID. These identifiers are not interchangeable; a MutualFund owner ID is not an AMC ID.

Each fund handle has a `portfolio` calculation handle with all three mix methods. This handle is not a downloaded holdings collection. The same methods on the fund delegate to that portfolio. Instruments returned by fund search and reference lookup also expose these conveniences. Reference results identify missing instruments explicitly; match by ID rather than position.

## Read results faithfully

Asset percentages may be negative or greater than 100. Sector and issuer outputs are equity-only. Preserve returned dates, warnings, availability status, and precision metadata. An unavailable mix is different from an empty or zero allocation. Zero-net underlying data can produce an explicit API error.

The method signatures are `(params?, requestOptions?)`. Pass `{}` for params when you only need request options: `portfolio.assetMix({}, { timeoutMs: 10000, maxRetries: 1 })`. Mix requests need no idempotency key and create no saved state. Cancellation and timeouts still apply.

## Dated positions and declared history

See [selectedSavedMix](../examples/portfolio-mixes.ts) for a paginated family → investor → saved portfolio selection flow. Selection callbacks are your application UI, not SDK methods.

For a saved portfolio, `portfolio.holdings.list()` and `.retrieve(id)` return scoped holdings. `holding.positionOn("2026-01-10")` resolves exact observed evidence or opening quantity plus buy/sell transactions within a declared complete range. Value-only observations retain `quantity: null`. A later opening does not hide an earlier exact observation, and missing dates never inherit current quantities.

Use `portfolio.history.import(body, { idempotencyKey })` to import source-tagged history, `.retrieve()` to inspect it, and `.canReconstruct(date)` to check strict availability. Completeness is a source/user assertion, not independent verification or an inference from matching ending balances. Every stored holding, including closed holdings and separate folios, must be supported for a complete dated portfolio.

`portfolio.on(positionDate).assetMix({ valuationDate, asOf })` uses server-side reconstruction and calculation. The dated view also supports `sectorMix` and `issuerMix`. Position date, valuation date (defaulting to position date), and underlying composition cutoff (`asOf`) are independent. Exact-date provider NAV is required; missing prices fail explicitly. For external credentials, historical market valuation dates and `asOf` cutoffs must be month starts; investor position dates remain unrestricted. Today’s market cutoff remains supported. Internal first-party access retains full historical dates. Fund handles do not expose investor dated views; in-memory value-only positions cannot reconstruct earlier dates.

Opening quantities apply at start of day; transactions through daily close use explicit sequence order. The account or folio containing the holding determines its timezone (initial default Asia/Kolkata). New supplied unit strings support up to 20 whole digits and four fractional places. Historical read responses retain earlier precision. Imports are idempotent by scoped source/event identity; conflicting payloads fail. A declared range can extend forward with the same start, and transaction-only imports preserve its source. No acquisition history is invented from an opening balance. Unsupported transfers, splits, corrections, reversals, price imports, tax lots and performance calculations fail explicitly. Check your service operator’s available features before relying on these operations.

## Current holding entry

Saved portfolios expose `holdings.setCurrent(input, {idempotencyKey})` for the
first-party current-entry workflow. Input contains `source` (`kind`: `user` or `statement`,
and `reference`), and `holdings` with `external_id`, `investment_account`, `instrument`
and `observed_position`. The observation contains `date` and `quantity` and/or INR
`current_value`. Decimal values are strings.

Omitting `quantity` converts the supplied dated amount into units on the server
using NAV on/before that date. The result preserves original amount, position
date, actual NAV, and half-even rounding to four decimal places. Missing NAV fails
the write. Explicit units retain supplied provenance. This creates no purchases
or transaction-history completeness. Historical snapshot writes are unchanged.

Each returned holding has `revision`. To correct the latest observation on its
same date, include `expected_revision` matching that revision and use a new
idempotency key. A stale revision conflicts; prior evidence remains in audit
history. A genuinely later observation starts revision 1. Retry an unchanged
operation with its original key to receive its original receipt. Do not change
dates to bypass a conflict. Distinct folios remain separate; an incomplete set
of valuations must not be presented as a complete total.

## Current portfolios valued with NAV

For a signed-in first-party application, `portfolio.current()` creates a read-only view of the saved portfolio's dated unit observations:

```ts
const portfolio = await bharosa.portfolios.retrieve(selectedPortfolioId);
const result = await portfolio.current().assetMix();
```

`selectedPortfolioId` comes from the portfolio selection described above. The view also exposes `sectorMix()` and `issuerMix()`. Each request values the stored units with the latest NAV on or before today in Asia/Kolkata, then uses the existing server calculation. This view takes no historical date parameter. Account keys and delegated third-party credentials cannot access it yet; a caller-owned transport alone does not grant access.

Read `result.current_valuation.holdings` for every folio's observation date, actual NAV date, freshness, revision and unit provenance. Older observed units are user-supplied ownership, not proof of today's ownership. Zero-unit holdings remain in the evidence. A missing quantity or NAV fails the entire calculation; no partial portfolio is silently normalized. A holding without a unit observation, or with transactions after its latest observation, requires an updated observation before this view can calculate.

Existing `portfolio.assetMix()` continues to use saved snapshot values. `portfolio.on(date)` continues to reconstruct supported historical positions. Neither behavior changes when using the current view.

## Selecting portfolios across households

Use `client.portfolios.list({ client_ids: selectedClientIds })` or `client.portfolios.list({ investor_ids: selectedInvestorIds })`. Each list contains 1–100 IDs, matches any selected ID and deduplicates results. Do not combine the two filters or supply an empty list. With neither, the result is the authorized account-wide portfolio list. `startingAfter` paginates the combined result; keep the filters unchanged. Foreign IDs fail rather than silently narrowing the result.

The earlier singular `client` option remains supported, but cannot be combined with either plural filter. HTTP clients encode plural filters as repeated keys, for example `client_ids=clt_…&client_ids=clt_…`, without brackets. Investor filtering is newly implemented; it was not previously supported.

`await client.accounts.retrieve()` uses the account configured on the SDK; no repeated account ID is needed. Its nullable `personal_client_id` identifies the authenticated human's linked household, not a new family resource or an access grant. Machine account keys receive null because they do not identify a signed-in person. A null link must not be replaced by guessing from a client name or account owner. The prelaunch public account response no longer exposes the internal `owner` user ID; ownership remains enforced on the server.

Units-first portfolio creation (local, unreleased): `portfolios.create` accepts an initial position with either `current_value` or positive `quantity`, never both, using the supplied `as_of` date. Existing amount requests and amount-only responses remain unchanged. Supplied units are stored atomically without requiring a NAV. Snapshot `quantity` can now be a decimal string and `valuation` can be null; `total_current_value` is null when any snapshot position lacks a reported amount, and `valuation_basis` is `supplied_quantity`. Consumers of general snapshot reads must handle these new nullable values; this is an intentional prelaunch type widening. Older SDKs cannot read units-only snapshots. Snapshot replacement and in-memory analytics remain amount-only. No public package release or availability change is implied.

## Empty creation and name updates (SDK 0.2.0)

The companion API accepts `positions: []` in `portfolios.create`. It persists a portfolio, investment account and zero-position snapshot immediately. Add the first holding afterward through the returned portfolio's `holdings.setCurrent` method. Cancellation before creation sends no request.

```ts
const renamed = await bharosa.portfolios.update(
  portfolio.id,
  { name: 'Family goals', expected_name: portfolio.name },
  { idempotencyKey: renameAttemptKey },
);
```

Use a fresh key for a new operation and the same key for an unchanged retry. Names must contain non-whitespace text and be at most 200 characters; the API trims the new name. `expected_name` must equal the stored name exactly. A concurrent rename returns `portfolio_name_conflict`; reload before deliberately retrying with the latest name. This compares names, not a general resource revision. Replaying a completed key returns its original receipt even if a later rename occurred. The operation returns a Portfolio and changes no holdings or snapshots. Existing account authorization and write-scope restrictions still apply; caller-owned transport does not grant access. These methods require an API deployment with portfolio lifecycle support.

An empty saved portfolio is valid. Mix calculations return HTTP 422 `portfolio_empty` until the selected snapshot/current view contains holdings. Treat this as an unavailable analysis state: “Your portfolio is saved. Add a holding to see its analysis.” Do not retry creation. An empty in-memory calculation remains invalid input. Current holdings added later do not rewrite the original empty snapshot; use the supported current view or save a nonempty snapshot for snapshot-based analysis.
