> SDK 0.8.0 adds stored indexes, fund benchmarks and [fund portfolio AUM](docs/fund-aum.md), including AUM in public fund portfolio and holdings responses. These methods require the matching server API. TER is unchanged.

# Bharosa SDK

A TypeScript client for Bharosa accounts, investors, portfolios, and mutual funds. Use one resource interface from TypeScript, ESM, or CommonJS, with no runtime dependencies.

**Published on npm:** `bharosa`. Both clients use the production API at `https://api.bharosa.finance` by default. Account access and credentials are still required; installing the SDK does not grant access.

## Start here

Use Node.js 22.12+ in a supported LTS release. Install the SDK in your backend application:

```sh
npm install bharosa
```

Source contributors can build and pack a local archive using the commands in CONTRIBUTING.md.

Configure your API key through your backend secret manager. Every active, unexpired API key has baseline market access; private account calls require the optional account permissions. Then:

```ts
import { Bharosa } from "bharosa";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
const bharosa = new Bharosa({
  apiKey: required("BHAROSA_SECRET_KEY"),
});
const latestNav = await bharosa.markets.schemes.nav("45139");
// Optional own-account permission is required for this call:
// const account = await bharosa.accounts.retrieve();
```

The startup check names missing environment variables without printing their values. See the [complete setup guide](docs/getting-started.md) for explicit checks and delegated authentication. CommonJS uses `const { Bharosa } = require("bharosa")`.

## Calculate a saved portfolio's mix

A client is a person or family group, such as the Rao family. An investor is one
member of that group. Each investor can have several saved portfolios; there is
no automatic "current portfolio" selection.

List families with `bharosa.clients.list()`, then list their members with
`bharosa.investors.list({ client: family.id })`. List portfolios with
`bharosa.portfolios.list({ client: family.id })` and keep those whose `investor`
field matches the selected member's ID. Let the user choose a portfolio, and
pass its returned ID to this function:

```ts
async function savedPortfolioMix(portfolioId: string) {
  const portfolio = await bharosa.portfolios.retrieve(portfolioId);
  const snapshot = await portfolio.currentSnapshot();
  const asset = await portfolio.assetMix();
  return { snapshot, asset };
}
```

Follow `has_more` and `startingAfter` when listing resources. Do not select the
first result or match only by a family name: names need not be unique. See the
[complete selection example](examples/portfolio-mixes.ts).

The saved mix uses the values and date in the portfolio's current saved snapshot.
It does not automatically reprice later holding-unit observations using today's
NAV. `asOf` changes the date used to look up the funds' underlying holdings; it
does not change the investor's positions or their valuation date.

For a fund, search first and let the user select the matching share class:

```ts
const matches = await bharosa.mutualFundSchemes.search({ query: "equity" });
// Display matches.data and let the user choose the intended fund/plan.
// Use scheme.fund() for the parent, or mutualFunds.fromInstrument(scheme.instrument.id) for mixes.
```

Use returned IDs rather than inventing them. The API calculates each mix; the SDK
makes the request. Asset percentages can be negative or above 100. Sector and
issuer mixes cover equities only. Keep the response's dates, warnings and
availability status alongside the numbers.

Read the [portfolio guide](docs/portfolios.md), or run the
[examples with simulated responses](examples/README.md) without live credentials.

## Read and build resources

`portfolios.build(...)` creates an in-memory calculation handle with a readable, immutable `positions` collection. It defensively copies supplied positions; changes to your original input cannot change future requests. `fromPositions(...)` remains an equivalent alias. Use `portfolios.create(...)` when you intend to persist a portfolio.

A saved portfolio has `currentSnapshot()` to retrieve its current snapshot using the existing snapshot API. A parent fund's `portfolio()` returns its selected public portfolio snapshot or null, with snapshot-bound `holdings()`. Call `fund.assetMix()`, `fund.sectorMix()` or `fund.issuerMix()` for analytics. Sector and issuer methods cover equity-only allocation.

The SDK also supports account reads, client lists, investor creation/updates, snapshot replacement, and mutual-fund discovery. Body and response fields use snake_case. Monetary values remain decimal strings. Lists use `limit` and `startingAfter`; investor/portfolio lists can filter by `client`. Root exports include TypeScript models and typed error classes.

Saved portfolios also expose scoped `holdings` and declared `history`. Use `holding.positionOn(date)` for dated evidence and `portfolio.on(date).assetMix({ valuationDate, asOf })` for strict server-side historical calculation. See [dated positions and declared history](docs/portfolios.md#dated-positions-and-declared-history) for completeness, exact-date valuation and supported-event limits. These methods do not move calculation code into the SDK.

## Reliability and security

Keep credentials in a backend or a server that handles browser sessions. Account-key and delegated authentication are server-only. Browser applications can use a caller-owned transport; the host application owns session handling, same-origin enforcement and CSRF. Bun and Deno are unsupported. Clients are immutable; private resources use the configured account context, while public market resources use baseline access. The SDK does not provision access, start consent, or refresh tokens.

Requests have a total 30-second timeout by default and zero retries unless requested. Creates require an idempotency key. A failed mutation can have an `unknown` outcome even if the server committed it. Use the [reliability guide](docs/reliability.md) to handle retries, cancellation, and reconciliation correctly.

Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## Develop and contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for reproducible tooling, synthetic tests, and packed-consumer verification. The [release checklist](docs/releasing.md) separates source publication from npm publication. The package is configured to prevent accidental npm publication.

## License and scope

[MIT](LICENSE) — Copyright (c) 2026 Bharosa Technoserve Private Limited.

The license covers this SDK. The Bharosa API service, analytics implementation, ingestion adapters, and provider datasets are separate and are not included or licensed by this repository.

### Monthly market history and synthetic samples

`client.marketSnapshots` exposes month-start historical market observations and latest NAV valuation without a separate market-data approval step, using any active, unexpired API key without accounts:read or portfolios:read. All external credentials, including direct account keys, use monthly historical market dates; investor transaction and position history retains its full dates. See [monthly snapshots](docs/monthly-market-data.md) for actual observation dates, missing data and availability. Installing the SDK does not grant account access.

The optional `bharosa/testing` entrypoint supplies fresh, deterministic synthetic portfolios and fictional fund compositions without credentials or network requests. Its seed helper writes only when explicitly called with an authenticated client, confirmed test account, stable run ID and resolved instrument mapping. See [testing samples](docs/testing.md).

Unit precision: supplied units accept at most four fractional digits; additional digits are rejected, never truncated. Dated amount conversion rounds once to four places using decimal half-even arithmetic; a positive amount rounding to zero returns `units_below_precision`. Currency and NAV precision are unchanged. Exact historical quantities and provenance remain in stored evidence and read responses; the web marks rounded displays with ≈, shows tiny positive values as <0.0001, and makes a rounded edit draft an explicit correction. Existing zero-unit closure remains supported; initial quantities must be positive. No portfolio reset or data rewrite is required. 

After installing the package, run `node node_modules/bharosa/examples/offline-smoke.mjs` for a credential-free synthetic read. This checks installed imports and the transport path without contacting Bharosa or creating data. It does not prove live access. Source-checkout verification commands require contributor files that are intentionally excluded from the runtime archive.

### Baseline market access

Use `new Bharosa({ apiKey })` and `client.markets` for account-independent latest NAV and monthly snapshots. Existing `new BharosaMarket({ apiKey })` clients remain compatible. Active, unexpired API keys have baseline market access without an investor OAuth token or a separate market-data approval. Legacy market-only keys still cannot access private accounts. Optional own-account permissions apply only to the key's authorized account; accessing another user's account still requires OAuth consent. Keep all secrets server-side.

### Optional API origin override

Set `baseUrl` only for another deployment or tests. Omitted or `undefined` uses `https://api.bharosa.finance`; invalid explicit values fail validation and never fall back. Overrides must be HTTPS origins without credentials, paths, queries or fragments. Local HTTP also requires `allowLocalhostHttp: true`. The SDK does not read `BHAROSA_API_BASE_URL` automatically.

## Growth performance and category returns

Provides `mutualFundSchemes.performance.retrieve` and `fundCategories.statistics.retrieve` for authenticated market access. See [analytics methods, coverage and limitations](docs/analytics.md). These legacy methods are available in SDK 0.6.0. SDK 0.7.0 also exposes the baseline methods described below. The API permission correction is deployed in revision 10.

## Unified API keys

SDK 0.5.0 introduced `new Bharosa({ apiKey })` and `client.markets`, using the existing account-independent market routes. Omit the NAV selection for latest NAV, or pass `{ asOf: "2026-10-01" }` for a monthly snapshot. Missing observations return `status: "missing"` and `data: null`. Explicit dates must be month starts. The legacy NAV alias also accepts omission and uses baseline key authentication; its account segment does not select private account data.

Existing `auth` configurations and `BharosaMarket` remain supported. Baseline calls use only the API key; delegated private calls still require user consent and a valid user token. The production origin remains `https://api.bharosa.finance`. Unified-key support is deployed. Private permissions remain optional and are enforced by the server; installing the SDK grants no additional access.

## Find a scheme with baseline market access

```ts
const choices = await bharosa.markets.schemes.search({ query: "equity", limit: 5 });
const selected = choices.data[0];
if (selected) {
  const nav = await bharosa.markets.schemes.nav(selected.scheme_id);
  console.log(selected.plan_label, selected.option_label, nav.status);
}
```

Choose the intended scheme and plan from the results. `query` must have 2–100 characters, with at least two after trimming; `limit` is 1–20 and defaults to 10. If `has_more` is true, refine the query; search has no cursor or historical date parameter. An empty `data` array is a valid result. Search returns scheme identities and latest NAV references, including freshness and data-mode information. It does not grant private account access. `mutualFundSchemes.search` returns hydrated schemes with parent IDs, plan/option labels, `fund()` and `nav()`. `mutualFunds.search` now returns parent funds with `schemes()` and `portfolio()`; this is an intentional v0.10 breaking change. `BharosaMarket` users can call `schemes.search` directly.

Available in SDK 0.6.0 and later, using the account-independent `/v1/market-data/schemes/search` route.

## Baseline analytics and valuation

SDK 0.7.0 adds `markets.schemes.performance.retrieve`, `markets.categories.statistics.retrieve`, `markets.schemes.references` and `markets.schemes.valuation`. `BharosaMarket` exposes the same methods without the `markets` prefix. These aliases and the legacy market-route authorization correction are deployed in API revision 10. The new SDK aliases are not present in SDK 0.6.0.

Caller-supplied valuation uses provided units and market NAV, never saved positions. Private account/portfolio holdings, history and mixes retain their authorization and consent requirements. Existing monthly date limits, production API origin and error handling remain unchanged. See [analytics](docs/analytics.md) and [market snapshots](docs/monthly-market-data.md) for these interfaces.

All new index, index-performance, fund/scheme benchmark, public mutual-fund portfolio, holdings and AUM methods are baseline market data. They require a valid active API key, not accounts:read or portfolios:read. Revocation, shared quotas and applicable monthly date restrictions remain enforced. Private user portfolios and accounts retain their existing permission/consent requirements.
