# Monthly market snapshots

`client.mutualFundSchemes` and `client.mutualFunds.portfolios` provide month-start market history and current NAV valuation. Monthly market data requires no separate application approval. Use authenticated credentials with the required account-read scope; installing the SDK does not authenticate you or grant private account access. Availability still depends on the deployed service and source data.

Resolve an investible scheme through `client.mutualFunds.search()` and its returned `scheme_id`. Fund-owner IDs and scheme IDs are distinct: NAV and expense ratios belong to schemes; portfolio snapshots and holdings belong to fund owners. Do not use an AMC ID as a fund-owner ID.

```ts
const matches = await client.mutualFunds.search({ query: "fund name" });
const match = matches.data[0];
if (!match) throw new Error("No matching fund; choose another search.");
const snapshot = await client.mutualFundSchemes.navs.retrieve(match.scheme_id, {
  asOf: "2026-08-01",
});
if (snapshot.status === "available") {
  console.log(
    snapshot.requested_date,
    snapshot.observation_date,
    snapshot.data.amount,
  );
}
```

Replace the search term with a fund you intend to inspect and choose among the returned plans. Histories accept only the first of a month, no later than today in Asia/Kolkata. Each snapshot selects the latest eligible observation on or before that date. The actual `observation_date` can be earlier, including around holidays. Missing observations return `status: "missing"`, `data: null` and `observation_date: null`; they are never converted to zero. Expense ratios are returned as stored normalized values, including null when the observation has no value.

Supported methods:

- `mutualFundSchemes.navs.retrieve(schemeId, { asOf })`
- `mutualFundSchemes.expenseRatios.retrieve(schemeId, { asOf })`
- `mutualFundSchemes.valuation(schemeId, { units })` for current value using the latest eligible NAV. Supply a month-start `asOf` for historical valuation. Actual NAV date and freshness are returned; old NAVs are not labelled today's prices.
- `mutualFunds.portfolios.retrieve(fundOwnerId, { asOf })`
- `mutualFunds.portfolios.holdings.list(fundOwnerId, { asOf, limit, startingAfter })`

The holdings response includes both the selected `portfolio` and a paginated `holdings` list inside `data`. Keep the same owner/date when advancing `startingAfter` using `next_cursor`; records cannot be requested by arbitrary historical portfolio ID on this surface. No observation is selected from the future. Effective dates do not prove when data became publicly available.

All external credentials, including direct account keys, are subject to monthly historical **market** limits. Investor transactions, position observations and history completeness retain their actual dates and remain queryable. Historical mix requests must use supported market cutoff and market valuation dates; this does not change the mix formulas or turn unavailable investor history into complete history. Full internal market history remains separate and first-party-only. Latest observations can be retained by clients each day; the policy does not prevent future accumulation.

Historical portfolio mix valuation requires a NAV observation on the exact requested valuation date. Unlike `marketSnapshots` lookups, it does not fall back to an earlier NAV. A month-start date that falls on a holiday can therefore return an unavailable-valuation error for a historical mix even when a monthly market snapshot is available. Investor history must also be sufficient for the requested position date; monthly market access does not fill gaps in that history.

The earlier `marketSnapshots` methods remain compatibility aliases using the same routes and response validation. Fund portfolio methods take a portfolio-owning mutual fund ID; scheme NAV and expense methods take an investible scheme ID. These IDs are never interchangeable. No new catalogue or discovery endpoint is implied by these resource names.
