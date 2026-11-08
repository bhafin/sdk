# Fund portfolio and AUM — SDK 0.8.0

These methods are included in SDK 0.8.0 and require the matching server API. They are not available in SDK 0.7.0 or API revision 10.

```ts
import { BharosaMarket } from "bharosa";
const market = new BharosaMarket({ apiKey: process.env.BHAROSA_SECRET_KEY! });
const observation = await market.funds.aum.retrieve("11417", {
  asOf: "2026-10-01",
});
if (observation.status === "available") {
  console.log(observation.data.amount, observation.data.currency);
}
```

## Simple fund resource chain — SDK 0.9.0

SDK 0.9.0 adds this chain, supported by API revision 13. It wraps the existing MutualFund-owned `portfolios` and `holdings` records.

```ts
import { Bharosa } from "bharosa";
const client = new Bharosa({ apiKey: process.env.BHAROSA_SECRET_KEY! });
const fund = await client.mutualFunds.retrieve("11417");
const portfolio = await fund.portfolio();
if (portfolio) {
  console.log(portfolio.id, portfolio.observation_date);
  if (portfolio.aum?.status === "available") {
    console.log(portfolio.aum.data.amount, portfolio.aum.data.currency);
  }
  let page = await portfolio.holdings({ limit: 100 });
  console.log(page.data);
  while (page.has_more && page.next_cursor) {
    page = await portfolio.holdings({ limit: 100, startingAfter: page.next_cursor });
    console.log(page.data);
  }
}
```

`fund.portfolio()` selects the latest stored portfolio dated on or before today in Asia/Kolkata. Pass `{ asOf: "2026-10-01" }` for historical selection; explicit dates remain month-start only. No portfolio returns `null`. AUM remains a status-bearing value on that same portfolio and is never calculated by summing its holdings.

`portfolio.holdings()` includes the selected portfolio ID on every page. If a later lookup selects a different portfolio or the record disappears, the API returns `409 fund_portfolio_changed`; restart from `fund.portfolio()`. The SDK also rejects a different returned ID/date. This pins identity, not an immutable snapshot of all holding rows: source corrections to the same stored record are not versioned by this interface.

Existing `fund.portfolio.assetMix()` and the flat `mutualFunds.portfolios.retrieve` / `holdings.list` methods remain supported. `fromId(fundId).portfolio()` skips the fund identity request. Instrument-only wrappers keep their existing mix methods; they are not silently treated as parent fund IDs. These public fund portfolios are distinct from private account portfolios and require only baseline market access.

The nested `portfolio.aum` uses the same stored value and observation date as the standalone fund AUM result. It is optional in SDK types for compatibility with older servers. Missing or invalid AUM does not hide an otherwise valid portfolio and its holdings. A conflicting latest portfolio selection fails explicitly. Separate calls use current retained records, so compare returned IDs/dates if ingestion changes between requests.

The account client exposes `client.mutualFunds.aum.retrieve(fundId, { asOf })`; `client.markets.funds.aum.retrieve` also supports this public market resource. Schemes have no AUM method. Direct/Regular and Growth/IDCW variants share the parent fund value; do not sum it once per scheme.

The measure follows the existing app's fund AUM method: the stored value of the fund-owned portfolio. `basis` is `stored_fund_portfolio_value`, with source table `portfolios`, field `value_cents`, source unit `paise`, portfolio ID and date. It does not assert an independently reported Accord period-end total or average AUM. There is no per-fund or per-observation evidence allowlist on this path.

`amount` is an exact decimal string in INR rupees, converted from integer paise by division by 100 without floating-point arithmetic. To display crore, divide rupees by 10,000,000. Zero is valid. Null, negative or malformed values and unsupported currencies return `unavailable`; null never becomes zero.

`asOf` must be a valid first-of-month date. The latest non-deleted portfolio belonging to the mutual fund on or before that date is selected. Future and personally owned portfolios are excluded. A missing latest value does not fall back to an older nonnull value. Multiple portfolios on the latest date return `unavailable` rather than being summed or selected arbitrarily. No eligible portfolio returns `missing`. Source-service failures return an error.

`observation_date` and source date identify the selected portfolio date. Valid values older than 62 days remain available with `quality.status: stale`. `history_basis: current_source_vintage` describes current retained source records, which ingestion may revise or delete; it is not a reconstruction of what was known at the historical publication date. `source_cutoff` is the requested cutoff and `source_version` identifies the read snapshot.

Existing market authentication, account boundaries and shared quotas apply. Category AUM aggregation remains disabled. This change needs no data migration and changes neither ingestion nor TER. Actual hosted permissions and data coverage require release validation; the local tests use synthetic data.

Authorization: every method described here is public baseline market data. A valid active API key is required; accounts:read, portfolios:read and investor consent are not required. Fund/scheme benchmark proxies use the same rule. Revocation, shared market quotas and applicable month-start date restrictions still apply. Private user accounts and portfolios keep their existing authorization requirements.
