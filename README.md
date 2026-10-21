# Bharosa SDK

A typed client for Bharosa accounts, investors, portfolios, and mutual funds. Use one resource interface from TypeScript, ESM, or CommonJS, with no runtime dependencies.

**Local development package.** This SDK is not published to npm. API access and credentials must come from your authorized deployment; no public API origin is assumed.

## Start here

Use Node.js 22.12+ in a supported LTS release. Build and pack this checkout:

```sh
npm run build
npm pack --pack-destination /absolute/path/to/artifacts
```

Install the generated archive in your backend application:

```sh
npm install /absolute/path/to/artifacts/bharosa-0.0.0-development.tgz
```

Configure your application's API origin, account ID, and account key through its secret manager. Then:

```ts
import { Bharosa } from "bharosa";

const bharosa = new Bharosa({
  baseUrl: process.env.BHAROSA_API_BASE_URL!,
  account: process.env.BHAROSA_ACCOUNT_ID!,
  auth: { type: "account_key", apiKey: process.env.BHAROSA_SECRET_KEY! },
});
const account = await bharosa.accounts.retrieve();
```

Validate required environment variables at application startup; the non-null assertions above are TypeScript annotations, not runtime checks. See the [complete setup guide](docs/getting-started.md) for explicit checks and delegated authentication. CommonJS uses `const { Bharosa } = require("bharosa")`.

## Work with portfolio objects

Retrieved portfolios expose read-only mix methods:

```ts
const portfolios = await bharosa.portfolios.list({ limit: 10 });
const portfolio = portfolios.data[0];
if (portfolio) {
  const asset = await portfolio.assetMix();
  const sector = await portfolio.sectorMix();
  const issuer = await portfolio.issuerMix();
}
```

You can also create a local portfolio handle without saving it:

```ts
const portfolio = bharosa.portfolios.build({
  valuationDate: "2026-10-17",
  positions: [
    {
      instrument: "ins_example_india_equity_direct_growth",
      current_value: "100",
    },
  ],
});
const asset = await portfolio.assetMix({ asOf: "2026-10-18" });
```

The instrument above is fictional. The API calculates the mix; the SDK sends the request. MutualFund handles expose the same methods through `fund.portfolio` and directly on the fund. Saved calculations use the current snapshot; `asOf` selects the underlying holdings cutoff, not saved portfolio history. Asset percentages can be negative or above 100; sector and issuer mixes are equity-only. Preserve returned dates, warnings, availability, and precision metadata.

Read the [portfolio guide](docs/portfolios.md), or run the [synthetic examples](examples/README.md) without live credentials.

## Read and build resources

`portfolios.build(...)` creates an in-memory calculation handle with a readable, immutable `positions` collection. It defensively copies supplied positions; changes to your original input cannot change future requests. `fromPositions(...)` remains an equivalent alias. Use `portfolios.create(...)` when you intend to persist a portfolio.

A saved portfolio has `currentSnapshot()` to retrieve its current snapshot using the existing snapshot API. A fund's `portfolio` is a calculation handle, not a downloaded holdings collection. Sector and issuer methods cover equity-only allocation.

The SDK also supports account reads, client lists, investor creation/updates, snapshot replacement, and mutual-fund discovery. Body and response fields use snake_case. Monetary values remain decimal strings. Lists use `limit` and `startingAfter`; investor/portfolio lists can filter by `client`. Root exports include TypeScript models and typed error classes.

## Reliability and security

Keep credentials in a backend or BFF. Account-key and delegated authentication are server-only. Browser applications can use a caller-owned transport; the host application owns session handling, same-origin enforcement and CSRF. Bun and Deno are unsupported. Clients are immutable and account-scoped. The SDK does not provision access, start consent, or refresh tokens.

Requests have a total 30-second timeout by default and zero retries unless requested. Creates require an idempotency key. A failed mutation can have an `unknown` outcome even if the server committed it. Use the [reliability guide](docs/reliability.md) to handle retries, cancellation, and reconciliation correctly.

Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## Develop and contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for reproducible tooling, synthetic tests, and packed-consumer verification. The [release checklist](docs/releasing.md) separates source publication from npm publication. Both require separate external-release authorization; publication guards remain enabled.

## License and scope

[MIT](LICENSE) — Copyright (c) 2026 Bharosa Technoserve Private Limited.

The license covers this SDK. The Bharosa API service, analytics implementation, ingestion adapters, and provider datasets are separate and are not included or licensed by this repository.

Saved portfolios also expose scoped `holdings` and declared `history`. Use `holding.positionOn(date)` for dated evidence and `portfolio.on(date).assetMix({ valuationDate, asOf })` for strict server-side historical calculation. See [dated positions and declared history](docs/portfolios.md#dated-positions-and-declared-history) for completeness, exact-date valuation and supported-event limits. These methods do not move calculation code into the SDK.
