# Synthetic samples for development

Import the optional `bharosa/testing` entrypoint. The main SDK entrypoint does not load sample data. Importing this module or calling `samplePortfolios()` / `sampleFunds()` never makes network requests or requires credentials. Each call returns fresh, deterministic objects.

The scenarios are equity-heavy, mixed allocation, overlapping fictional funds, and an empty new investor. Dates are fixed at January 1, 2026. All `synthetic:` symbols and underlying assets are invented; they are not market instrument IDs. `sampleFunds()` contains illustrative compositions for offline UI tests, not a financial calculation engine. Mapping symbols to actual funds does not guarantee those funds have the fictional composition.

```ts
import { samplePortfolios, sampleFunds } from "bharosa/testing";
const portfolios = samplePortfolios();
const funds = sampleFunds();
```

To explicitly create a sample in an authenticated developer test account, use `seedSamplePortfolio(client, options)`. Supply `confirmTestAccount` with the account ID returned by your API, a stable `runId`, a scenario ID, and an `instruments` map from every required synthetic symbol to an instrument resolved in that environment. Missing mappings and account mismatches fail before writes. No fabricated market IDs are supplied by the helper.

The helper cannot attest that an account is a test environment: use an account you control solely for development, never a customer or production account. It does not automatically seed anything. It creates reported, dated portfolio snapshots; it does not invent transactions or units. The empty scenario creates only an investor.

Investor and portfolio creation are two separate idempotent requests, not an atomic transaction. On failure, `SampleSeedError.phase` and `.investor` explain which step failed and whether the investor is known. Retry with exactly the same account, run ID, scenario and mapping. A lost response may follow a successful write; do not choose a new run ID to retry. The API rejects an idempotency key reused with a different body. Deliberately use a new run ID only to create another sample. The helper neither deletes resources nor hides upstream validation/authentication errors.

Validation happens before any client call for invalid run IDs or mappings: `runId` must be an actual string of 1–64 letters, digits, underscores or hyphens. Instrument IDs must have an `ins_` prefix followed by 1–150 supported characters; mappings must be distinct within a portfolio.

Once a portfolio has been persisted, changing its instrument mapping while reusing the same run ID deliberately causes an upstream idempotency conflict. The helper does not overwrite the earlier sample. If investor creation succeeded but portfolio creation never persisted, a subsequent request can create the portfolio; retries should still preserve the original mapping. No local helper can know the outcome of a lost response. Tests model a persistent idempotency ledger and drop responses after committing both investor and portfolio creation, then verify replay returns the original IDs without adding rows. These are synthetic tests, not proof of hosted integration.
