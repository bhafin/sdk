# Growth scheme performance and category returns

The two analytics methods are deployed and published in SDK 0.4.0. SDK 0.5.0 and later preserve them. Default origin is https://api.bharosa.finance; explicit baseUrl overrides remain supported. With the permission correction deployed in API revision 10, scheme performance and category statistics now support baseline market access without account permissions. Use `client.markets.schemes.performance.retrieve` and `client.markets.categories.statistics.retrieve`; `BharosaMarket` exposes the same methods without `markets`. Legacy methods remain compatible. The baseline SDK aliases are introduced in 0.7.0; existing 0.6.0 methods remain compatible.

```ts
import { Bharosa } from "bharosa";
const client = new Bharosa({
  apiKey: process.env.BHAROSA_SECRET_KEY!,
});
const scheme = await client.markets.schemes.performance.retrieve("45139", {
  asOf: "2026-10-01", periods: ["1y", "3y"],
});
const category = await client.markets.categories.statistics.retrieve("index_fund", {
  asOf: "2026-10-01", periods: ["1y"], metrics: ["return"],
  plan: "direct", option: "growth",
});
```

Use an exact first-of-month asOf. Discover category identifiers through marketData.categories.list; index_fund is a real category, equity was only a local fixture label. Category metrics accepts only return and defaults to return. Category returns are equal-weight means with fund deduplication, minimum3valid funds and80%coverage; inspect status/reason and eligible/valid/missing/invalid/stale counts. An HTTP200 can correctly contain an unavailable metric. Current classification is applied to historical prices, with survivorship/reclassification bias; this is not an investable index return.

Scheme responses report exact NAV observations and boundary lags, total return, and annualization over observed dates using365.25days. CAGR is unavailable for periods not longer than one year. IDCW and unverified inception remain explicitly unavailable. NAV freshness limits and missing data must be checked before using a value.

There are no investor-performance or fund-AUM methods or public types in this release. Stated-TER comparisons remain deferred; existing expense-ratio methods retain their prior behavior. Future AUM belongs to mutualFunds, not schemes. Shared response freshness metadata includes aum_days/ter_days because the deployed envelope contains those fields; their presence does not expose AUM/TER methods.

Hosted scheme/category verification used the app-origin compatibility path with synthetic account access and real market data. Authenticated verification on the new api hostname remains a final-trial requirement; do not claim that journey has passed. No SDK example should create credentials or mutate a portfolio.
