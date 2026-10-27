# Bharosa SDK

A TypeScript client for Bharosa accounts, investors, portfolios, and mutual funds. Use one resource interface from TypeScript, ESM, or CommonJS, with no runtime dependencies.

**Release target:** `bharosa@0.1.0`. Registry publication is pending; use the reviewed local archive until publication is confirmed. You also need an API URL and credentials from the operator of your Bharosa service; installing the SDK does not create an account or grant access.

## Start here

Use Node.js 22.12+ in a supported LTS release. If you have the source checkout, build and pack it:

```sh
npm --prefix tooling ci --ignore-scripts
npm run build
npm pack --pack-destination /absolute/path/to/artifacts
```

If the operator supplied a reviewed archive, skip the source build. Install that archive in your backend application:

```sh
npm install /absolute/path/to/artifacts/bharosa-0.1.0.tgz
```

Configure your application's API origin, account ID, and account key through its secret manager. Then:

```ts
import { Bharosa } from "bharosa";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
const bharosa = new Bharosa({
  baseUrl: required("BHAROSA_API_BASE_URL"),
  account: required("BHAROSA_ACCOUNT_ID"),
  auth: { type: "account_key", apiKey: required("BHAROSA_SECRET_KEY") },
});
const account = await bharosa.accounts.retrieve();
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
const matches = await bharosa.mutualFunds.search({ query: "equity" });
// Display matches.data and let the user choose the intended fund/plan.
// The returned instrument exposes assetMix(), sectorMix() and issuerMix().
```

Use returned IDs rather than inventing them. The API calculates each mix; the SDK
makes the request. Asset percentages can be negative or above 100. Sector and
issuer mixes cover equities only. Keep the response's dates, warnings and
availability status alongside the numbers.

Read the [portfolio guide](docs/portfolios.md), or run the
[examples with simulated responses](examples/README.md) without live credentials.

## Read and build resources

`portfolios.build(...)` creates an in-memory calculation handle with a readable, immutable `positions` collection. It defensively copies supplied positions; changes to your original input cannot change future requests. `fromPositions(...)` remains an equivalent alias. Use `portfolios.create(...)` when you intend to persist a portfolio.

A saved portfolio has `currentSnapshot()` to retrieve its current snapshot using the existing snapshot API. A fund's `portfolio` is a calculation handle, not a downloaded holdings collection. Sector and issuer methods cover equity-only allocation.

The SDK also supports account reads, client lists, investor creation/updates, snapshot replacement, and mutual-fund discovery. Body and response fields use snake_case. Monetary values remain decimal strings. Lists use `limit` and `startingAfter`; investor/portfolio lists can filter by `client`. Root exports include TypeScript models and typed error classes.

Saved portfolios also expose scoped `holdings` and declared `history`. Use `holding.positionOn(date)` for dated evidence and `portfolio.on(date).assetMix({ valuationDate, asOf })` for strict server-side historical calculation. See [dated positions and declared history](docs/portfolios.md#dated-positions-and-declared-history) for completeness, exact-date valuation and supported-event limits. These methods do not move calculation code into the SDK.

## Reliability and security

Keep credentials in a backend or a server that handles browser sessions. Account-key and delegated authentication are server-only. Browser applications can use a caller-owned transport; the host application owns session handling, same-origin enforcement and CSRF. Bun and Deno are unsupported. Clients are immutable and account-scoped. The SDK does not provision access, start consent, or refresh tokens.

Requests have a total 30-second timeout by default and zero retries unless requested. Creates require an idempotency key. A failed mutation can have an `unknown` outcome even if the server committed it. Use the [reliability guide](docs/reliability.md) to handle retries, cancellation, and reconciliation correctly.

Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## Develop and contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for reproducible tooling, synthetic tests, and packed-consumer verification. The [release checklist](docs/releasing.md) separates source publication from npm publication. The package is configured to prevent accidental npm publication.

## License and scope

[MIT](LICENSE) — Copyright (c) 2026 Bharosa Technoserve Private Limited.

The license covers this SDK. The Bharosa API service, analytics implementation, ingestion adapters, and provider datasets are separate and are not included or licensed by this repository.

### Monthly market history and synthetic samples

`client.marketSnapshots` exposes month-start historical market observations and latest NAV valuation without a separate market-data approval step, using authenticated credentials with the required account-read scope. All external credentials, including direct account keys, use monthly historical market dates; investor transaction and position history retains its full dates. See [monthly snapshots](docs/monthly-market-data.md) for actual observation dates, missing data and availability. This local implementation does not activate live access.

The optional `bharosa/testing` entrypoint supplies fresh, deterministic synthetic portfolios and fictional fund compositions without credentials or network requests. Its seed helper writes only when explicitly called with an authenticated client, confirmed test account, stable run ID and resolved instrument mapping. See [testing samples](docs/testing.md).

Unit precision follow-up (local, unreleased): supplied units accept at most four fractional digits; additional digits are rejected, never truncated. Dated amount conversion rounds once to four places using decimal half-even arithmetic; a positive amount rounding to zero returns `units_below_precision`. Currency and NAV precision are unchanged. Exact historical quantities and provenance remain in stored evidence and read responses; the web marks rounded displays with ≈, shows tiny positive values as <0.0001, and makes a rounded edit draft an explicit correction. Existing zero-unit closure remains supported; initial quantities must be positive. No portfolio reset or data rewrite is required. Canonical marketing reconciliation is coordinated through the parent, with deployment pending.

After installing the archive, run `node node_modules/bharosa/examples/offline-smoke.mjs` for a credential-free synthetic read. This checks installed imports and the transport path without contacting Bharosa or creating data. It does not prove live access. Source-checkout verification commands require contributor files that are intentionally excluded from the runtime archive.
