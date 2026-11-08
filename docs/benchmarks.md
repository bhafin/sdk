# Stored indexes and fund benchmarks — SDK 0.8.0

These additive methods are included in SDK 0.8.0 and require the matching server API. They are not included in SDK 0.7.0. Existing market and private-account methods are unchanged.

Use the same server-side API-key configuration as `bharosa.markets`. No private account or portfolio permission is introduced. All new paths start with `/v1/market-data`. `BharosaMarket` exposes the same resources directly, without `.markets`.

| SDK method                                                            | GET path after `/v1/market-data`      |
| --------------------------------------------------------------------- | ------------------------------------- |
| `markets.indexes.list({ query?, limit?, startingAfter? })`            | `/indexes`                            |
| `markets.indexes.retrieve(indexId)`                                   | `/indexes/{id}`                       |
| `markets.indexes.performance.retrieve(indexId, selection)`            | `/indexes/{id}/performance`           |
| `markets.funds.benchmark.retrieve(fundId)`                            | `/funds/{id}/benchmark`               |
| `markets.funds.benchmark.performance.retrieve(fundId, selection)`     | `/funds/{id}/benchmark/performance`   |
| `markets.schemes.benchmark.retrieve(schemeId)`                        | `/schemes/{id}/benchmark`             |
| `markets.schemes.benchmark.performance.retrieve(schemeId, selection)` | `/schemes/{id}/benchmark/performance` |

The index list is ordered by numeric ID. `limit` defaults to 20 and may be 1–100. Optional `query` is 2–100 characters; `%` and `_` are literal. When `has_more` is true, pass the last returned ID as `startingAfter` (HTTP `starting_after`). Index IDs and sub-index IDs are different identifiers. Each index lists its stored variants, `tri`, `pri`, and `adj_tri`. Index performance defaults to stored TRI, then PRI. Select another listed variant with `subIndexId` (HTTP `sub_index_id`); an absent default produces an unavailable result.

Benchmark composition belongs to the mutual fund. Scheme methods resolve the parent fund and run the same service, adding `scheme_id` to the response. They do not use scheme NAVs or depend on a Direct/Regular/Growth plan. The response retains `fund_id`, stored component IDs, names, variants, `benchmark_type` (`fund`, `assigned`, `default`) and decimal-string `weight_pct`.

Performance selection requires `asOf` (HTTP `as_of`), a first-of-month cutoff. `periods` accepts `1y`, `3y`, `5y`, defaulting to all three. HTTP represents periods as a comma-separated string; the SDK uses an array. `since_inception` is not supported here. The existing scheme-NAV performance methods remain separate.

```ts
// Use an exact fund ID selected by your application.
const result = await bharosa.markets.funds.benchmark.performance.retrieve(
  fundId,
  {
    asOf: "2026-10-01",
    periods: ["1y", "3y", "5y"],
  },
);
for (const period of result.periods) {
  const metric =
    period.period === "1y" ? period.total_return_pct : period.cagr_pct;
  console.log(
    period.period,
    metric.status === "available" ? metric.value : metric.reason,
  );
}
```

Calculations use the stored benchmark mappings and stored quotes directly. No quote regeneration, replacement of index variants or inferred mapping history occurs. `mapping_basis: current_stored` means the current stored basket is applied to historical quote intervals. It does not claim the basket was the fund's benchmark throughout that interval. `basis: stored_quotes` also does not claim official, unadjusted total-return data; `adj_tri` is the existing Bharosa-adjusted variant.

`methodology_version: stored_weighted_component_returns_v1` follows the app's weighted component-return semantics: total return is the sum of each component's total return times its stored weight/100; CAGR is the sum of each component's CAGR times its stored weight/100. It is not the CAGR of a periodically rebalanced portfolio. Weights are preserved without normalization. Component quotes and their observation dates are included for inspection. Zero-weight components do not affect the aggregate.

Each result includes requested cutoff, source cutoff/version, methodology, precision, freshness policy and warnings. Periods contain requested boundaries and per-component actual dates, quotes, currency, lag days and elapsed days. Quotes are selected on or before each boundary; the 45-day freshness limit follows existing performance conventions. Each component's CAGR annualizes using its actual elapsed days/365.25 and requires more than 365 elapsed days. Percentage values are decimal strings: `10` means ten percent.

Check each metric's `status`, `value` and `reason`. Missing history for one period does not suppress other periods. An unavailable nonzero component makes the aggregate unavailable; no component is silently dropped or its weight redistributed. Empty baskets return `benchmark_not_configured`. Other reasons include `start_quote_missing`, `end_quote_missing`, `quote_stale`, `invalid_quote`, `unsupported_currency`, `component_return_unavailable` and `period_not_longer_than_one_year`. A `200` response can contain unavailable metrics; null is not zero.

Invalid requests return `400`; missing identities or an unowned sub-index return `404`; source size limits return `422`; unavailable sources return `503`; calculation timeouts return `504`. Existing API-key authentication, expiry/revocation, delegated-token validation and market quotas remain in force. Private account methods remain separately authorized.

Authorization: every method described here is public baseline market data. A valid active API key is required; accounts:read, portfolios:read and investor consent are not required. Fund/scheme benchmark proxies use the same rule. Revocation, shared market quotas and applicable month-start date restrictions still apply. Private user accounts and portfolios keep their existing authorization requirements.
