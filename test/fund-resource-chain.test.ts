import { test } from "node:test";
import assert from "node:assert/strict";
import { Bharosa, InvalidResponseError } from "../dist/index.mjs";
const owner = {
  id: "7",
  name: "Synthetic fund",
  amc_id: null,
  category: null,
  active: true,
  manager_ids: [],
};
const portfolio = { id: "51", fund_id: "7", date: "2026-10-22" };
const snapshot = (data: any) => ({
  object: "market_snapshot",
  requested_date: "2026-10-23",
  observation_date: "2026-10-22",
  status: "available",
  data,
});
const holding = {
  id: "2",
  portfolio_id: "51",
  date: "2026-10-22",
  asset_type: "CommonEquity",
  asset_id: "9",
  units: "1.0000",
  value: { amount: "123.45", currency: "INR" },
};
const page = {
  object: "list",
  data: [holding],
  has_more: false,
  next_cursor: null,
  source: "normalized_market_database",
};
test("retrieve fund -> latest portfolio -> bound holdings uses baseline credentials only", async () => {
  const urls: URL[] = [];
  const sdk = new Bharosa({
    account: "acct_0123456789abcdef0123456789abcdef",
    auth: {
      type: "delegated_application",
      apiKey: "synthetic",
      userAccessToken: "synthetic-user",
    },
    fetch: async (input, init) => {
      const u = new URL(String(input));
      urls.push(u);
      assert.equal(u.origin, "https://api.bharosa.finance");
      assert.equal(
        new Headers(init?.headers).get("Bharosa-User-Authorization"),
        null,
      );
      if (u.pathname === "/v1/market-data/funds/7") return Response.json(owner);
      if (u.pathname.endsWith("/portfolios"))
        return Response.json(snapshot(portfolio));
      assert.equal(u.pathname, "/v1/market-data/funds/7/holdings");
      assert.equal(u.searchParams.get("portfolio_id"), "51");
      assert.equal(u.searchParams.get("portfolio_date"), "2026-10-22");
      return Response.json(snapshot({ portfolio, holdings: page }));
    },
  });
  const fund = await sdk.mutualFunds.retrieve("7");
  assert.equal(typeof fund.portfolio, "function");
  assert.equal(Object.hasOwn(fund.portfolio, "assetMix"), false);
  const selected = await fund.portfolio();
  assert.ok(selected);
  assert.equal(selected.id, "51");
  assert.equal(selected.observation_date, "2026-10-22");
  assert.deepEqual(await selected.holdings({ limit: 5 }), page);
  await selected.holdings({ startingAfter: "2" });
  assert.ok(urls.every((u) => !u.searchParams.has("as_of")));
  assert.equal(urls.at(-1)!.searchParams.get("starting_after"), "2");
});
test("selection copied once; explicit non-month dates rejected; missing portfolio is null", async () => {
  let calls = 0;
  const selection = { asOf: "2026-10-01" };
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async (input) => {
      calls++;
      const u = new URL(String(input));
      assert.equal(u.searchParams.get("as_of"), "2026-10-01");
      return Response.json({
        object: "market_snapshot",
        requested_date: "2026-10-01",
        observation_date: null,
        status: "missing",
        data: null,
      });
    },
  });
  assert.equal(await sdk.mutualFunds.fromId("7").portfolio(selection), null);
  await assert.rejects(() =>
    sdk.mutualFunds.fromId("7").portfolio({ asOf: "2026-10-22" }),
  );
  assert.equal(calls, 1);
});
test("mismatched fund identity and changed holdings selection are not returned", async () => {
  const bad = new Bharosa({
    apiKey: "synthetic",
    fetch: async () => Response.json({ ...owner, id: "8" }),
  });
  await assert.rejects(bad.mutualFunds.retrieve("7"), InvalidResponseError);
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async (input) =>
      Response.json(
        String(input).includes("/holdings")
          ? snapshot({
              portfolio: { ...portfolio, id: "52" },
              holdings: { ...page, data: [] },
            })
          : snapshot(portfolio),
      ),
  });
  const selected = await sdk.mutualFunds.fromId("7").portfolio();
  assert.ok(selected);
  await assert.rejects(selected.holdings(), InvalidResponseError);
});
test("explicit fund.assetMix remains callable without a portfolio fetch", async () => {
  let calls = 0;
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async (input) => {
      calls++;
      assert.match(String(input), /\/portfolios\/asset_mix$/);
      return Response.json(
        { error: { code: "synthetic_unavailable", message: "unavailable" } },
        { status: 503 },
      );
    },
  });
  await assert.rejects(sdk.mutualFunds.fromId("7").assetMix());
  assert.equal(calls, 1);
});
test("historical resource captures cutoff and AUM; caller mutation cannot retarget holdings", async () => {
  const date = "2026-09-30";
  const selected = {
    ...portfolio,
    date,
    aum: {
      object: "market_snapshot",
      requested_date: "2026-10-01",
      observation_date: date,
      status: "available",
      data: {
        fund_id: "7",
        date,
        amount: "123.45",
        currency: "INR",
        unit: "rupee",
        scope: "fund",
        basis: "stored_fund_portfolio_value",
        source: {
          table: "portfolios",
          field: "value_cents",
          portfolio_id: "51",
          date,
          source_unit: "paise",
        },
      },
      quality: { status: "fresh", age_days: 1, limit_days: 62 },
    },
  };
  const envelope = (data: any) => ({
    ...snapshot(data),
    requested_date: "2026-10-01",
    observation_date: date,
  });
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async (input) => {
      const u = new URL(String(input));
      assert.equal(u.searchParams.get("as_of"), "2026-10-01");
      if (u.pathname.endsWith("/holdings"))
        assert.equal(u.searchParams.get("portfolio_date"), "2026-09-30");
      return Response.json(
        u.pathname.endsWith("/holdings")
          ? envelope({
              portfolio: selected,
              holdings: { ...page, data: [{ ...holding, date }] },
            })
          : envelope(selected),
      );
    },
  });
  const query = { asOf: "2026-10-01" };
  const p = await sdk.mutualFunds.fromId("7").portfolio(query);
  assert.ok(p);
  query.asOf = "2026-09-01";
  assert.equal(p.aum?.status, "available");
  await p.holdings();
});
test("aborted fund lookup makes no transport call and unknown options are rejected", async () => {
  let calls = 0;
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async () => {
      calls++;
      return Response.json(owner);
    },
  });
  const c = new AbortController();
  c.abort();
  await assert.rejects(sdk.mutualFunds.retrieve("7", { signal: c.signal }));
  await assert.rejects(
    sdk.mutualFunds
      .fromId("7")
      .portfolio({ asOf: "2026-10-01", unexpected: true } as any),
  );
  assert.equal(calls, 0);
});

test("resource sends captured date on page two and propagates deliberate409", async () => {
  let holdingsCalls = 0;
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async (input) => {
      const u = new URL(String(input));
      if (!u.pathname.endsWith("/holdings"))
        return Response.json(snapshot({ ...portfolio }));
      assert.equal(u.searchParams.get("portfolio_id"), "51");
      assert.equal(u.searchParams.get("portfolio_date"), "2026-10-22");
      holdingsCalls++;
      if (holdingsCalls === 1)
        return Response.json(snapshot({ portfolio, holdings: page }));
      return Response.json(
        {
          error: {
            type: "invalid_request_error",
            param: null,
            request_id: "req_fixture",
            code: "fund_portfolio_changed",
            message: "Selected portfolio changed",
          },
        },
        { status: 409, headers: {"Request-Id": "req_fixture"} },
      );
    },
  });
  const selected = await sdk.mutualFunds.fromId("7").portfolio();
  assert.ok(selected);
  await selected.holdings();
  Reflect.set(selected, "observation_date", "2026-10-21");
  selected.date = "2026-10-21";
  await assert.rejects(selected.holdings({ startingAfter: "2" }), {
    status: 409,
    code: "fund_portfolio_changed",
  });
});
