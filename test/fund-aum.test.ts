import { test } from "node:test";
import assert from "node:assert/strict";
import { Bharosa, BharosaMarket } from "../dist/index.mjs";
const result = {
  object: "market_snapshot",
  fund_id: "11417",
  requested_date: "2026-10-01",
  source_cutoff: "2026-10-01",
  source_version: "fixture",
  history_basis: "current_source_vintage",
  status: "available",
  observation_date: "2026-09-30",
  data: {
    fund_id: "11417",
    date: "2026-09-30",
    amount: "39000119970",
    currency: "INR",
    unit: "rupee",
    scope: "fund",
    basis: "stored_fund_portfolio_value",
    source: {
      table: "portfolios",
      field: "value_cents",
      portfolio_id: "501",
      date: "2026-09-30",
      source_unit: "paise",
    },
  },
  quality: { status: "fresh", age_days: 1, limit_days: 62 },
};
test("AUM is fund-owned in account and baseline clients, exact decimal retained", async () => {
  const paths: string[] = [];
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    paths.push(url.pathname);
    assert.equal(url.search, "?as_of=2026-10-01");
    assert.equal(
      new Headers(init?.headers).get("authorization"),
      "Bearer synthetic",
    );
    return Response.json(result);
  };
  const client = new Bharosa({
    baseUrl: "https://fixture.invalid",
    account: "me",
    auth: { type: "account_key", apiKey: "synthetic" },
    fetch,
  });
  const market = new BharosaMarket({
    baseUrl: "https://fixture.invalid",
    apiKey: "synthetic",
    fetch,
  });
  assert.equal(
    (await client.mutualFunds.aum.retrieve("11417", { asOf: "2026-10-01" }))
      .data?.amount,
    "39000119970",
  );
  assert.equal(
    (await market.funds.aum.retrieve("11417", { asOf: "2026-10-01" })).data
      ?.amount,
    "39000119970",
  );
  assert.deepEqual(paths, [
    "/v1/accounts/me/market-data/funds/11417/aum",
    "/v1/market-data/funds/11417/aum",
  ]);
  assert.equal("aum" in client.mutualFundSchemes, false);
  assert.throws(() =>
    client.mutualFunds.aum.retrieve("11417", {
      asOf: "2026-10-01",
      plan: "direct",
    } as never),
  );
  assert.throws(() =>
    client.mutualFunds.aum.retrieve("11417", { asOf: "2026-10-02" }),
  );
  assert.equal(paths.length, 2);
});
test("AUM validates identity, null states and refuses malformed or mismatched responses", async () => {
  for (const r of [
    { ...result, fund_id: "999" },
    { ...result, data: { ...result.data, fund_id: "999" } },
    { ...result, observation_date: "2026-11-30" },
    { ...result, data: null },
  ]) {
    const market = new BharosaMarket({
      baseUrl: "https://fixture.invalid",
      apiKey: "synthetic",
      fetch: async () => Response.json(r),
    });
    await assert.rejects(
      market.funds.aum.retrieve("11417", { asOf: "2026-10-01" }),
      { kind: "invalid_response" },
    );
  }
  for (const state of [
    { status: "missing", observation_date: null, data: null },
    {
      status: "unavailable",
      observation_date: "2026-09-30",
      data: null,
      reason: "portfolio_value_missing",
      quality: null,
    },
  ]) {
    const { quality, ...base } = result;
    const market = new BharosaMarket({
      baseUrl: "https://fixture.invalid",
      apiKey: "synthetic",
      fetch: async () => Response.json({ ...base, ...state }),
    });
    assert.equal(
      (await market.funds.aum.retrieve("11417", { asOf: "2026-10-01" })).data,
      null,
    );
  }
});

test("portfolio and holdings expose the same AUM and reject mismatched provenance", async () => {
  const { fund_id, source_cutoff, source_version, history_basis, ...aum } =
    result;
  const portfolio = { id: "501", fund_id, date: "2026-09-30", aum };
  const envelope = {
    object: "market_snapshot",
    requested_date: "2026-10-01",
    observation_date: "2026-09-30",
    status: "available",
  };
  const client = new Bharosa({
    apiKey: "synthetic",
    fetch: async (url) =>
      Response.json({
        ...envelope,
        data: String(url).includes("/holdings")
          ? {
              portfolio,
              holdings: {
                object: "list",
                data: [],
                has_more: false,
                next_cursor: null,
                source: "normalized_market_database",
              },
            }
          : portfolio,
      }),
  });
  const p = await client.mutualFunds.portfolios.retrieve(fund_id, {
    asOf: "2026-10-01",
  });
  const h = await client.mutualFunds.portfolios.holdings.list(fund_id, {
    asOf: "2026-10-01",
  });
  assert.deepEqual(p.data?.aum, h.data?.portfolio.aum);
  assert.equal(p.data?.aum?.data?.amount, result.data.amount);
  for (const change of [{ portfolio_id: "999" }, { date: "2026-08-31" }]) {
    portfolio.aum = {
      ...aum,
      data: { ...aum.data, source: { ...aum.data.source, ...change } },
    };
    await assert.rejects(
      client.mutualFunds.portfolios.retrieve(fund_id, { asOf: "2026-10-01" }),
      { kind: "invalid_response" },
    );
    await assert.rejects(
      client.mutualFunds.portfolios.holdings.list(fund_id, {
        asOf: "2026-10-01",
      }),
      { kind: "invalid_response" },
    );
  }
});
