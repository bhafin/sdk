import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Bharosa, APIError } from "../src/index.mjs";
afterEach(() => {
  delete globalThis.window;
  delete globalThis.document;
});
const result = {
  status: "available",
  scheme_id: "11",
  units: "1.25",
  as_of: "2026-01-11",
  position_date: "2026-01-11",
  ownership_status: "user_supplied_not_verified",
  value: { amount: "154.320875", currency: "INR" },
  nav: { amount: "123.4567", currency: "INR", date: "2026-01-09" },
  freshness: {
    status: "recent",
    age_days: 2,
    recent_within_days: 3,
    time_zone: "Asia/Kolkata",
  },
  valuation_basis: "units_times_latest_nav",
};
test("generic transport receives typed operation, cancellation and safe request defaults without auth material", async () => {
  globalThis.window = {};
  const calls = [];
  const client = new Bharosa({
    baseUrl: "https://app.example",
    account: "me",
    transport: {
      send: async (url, options) => {
        calls.push({ url, options });
        return Response.json(result);
      },
    },
  });
  const value = await client.marketData.schemes.valuation("11", {
    units: "1.25",
    asOf: "2026-01-11",
    positionDate: "2026-01-11",
  });
  assert.equal(value.value.amount, "154.320875");
  assert.equal(
    calls[0].url,
    "https://app.example/app-api/market-data/valuations",
  );
  assert.equal(calls[0].options.credentials, "omit");
  assert.equal(calls[0].options.redirect, "error");
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(calls[0].options.headers["X-CSRF-Token"], undefined);
  assert.ok(calls[0].options.signal instanceof AbortSignal);
});
test("custom transport cannot be combined with credential modes or a second fetch", () => {
  const transport = { send: async () => Response.json({}) };
  assert.throws(
    () =>
      new Bharosa({
        baseUrl: "https://app.example",
        account: "me",
        auth: { type: "account_key", apiKey: "synthetic" },
        transport,
      }),
  );
  assert.throws(
    () =>
      new Bharosa({
        baseUrl: "https://app.example",
        account: "me",
        fetch: fetch,
        transport,
      }),
  );
  globalThis.window = {};
  assert.throws(
    () =>
      new Bharosa({
        baseUrl: "https://app.example",
        account: "me",
        auth: { type: "account_key", apiKey: "synthetic" },
      }),
  );
});
test("typed discovery preserves query and transport choice confers no access", async () => {
  let request;
  const client = new Bharosa({
    baseUrl: "https://app.example",
    account: "me",
    transport: {
      send: async (url, options) => {
        request = { url, options };
        return Response.json(
          {
            error: {
              type: "permission_error",
              code: "first_party_flow_required",
              message: "first party flow required",
              param: null,
              request_id: "fixture",
            },
          },
          { status: 403, headers: { "Request-Id": "fixture" } },
        );
      },
    },
  });
  await assert.rejects(
    client.marketData.funds.list({
      amc: "4",
      category: "equity",
      manager: "7",
      limit: 10,
    }),
    APIError,
  );
  assert.match(request.url, /amc=4/);
});

test("current-holding write uses the scoped portfolio and preserves dated amount/provenance transport", async () => {
  const p = "ptf_" + "1".repeat(32),
    a = "acct_" + "2".repeat(32),
    h = "hld_" + "3".repeat(32);
  let request;
  const c = new Bharosa({
    baseUrl: "https://app.example",
    account: "me",
    transport: {
      send: async (url, options) => {
        request = { url, options };
        if (options.method === "GET")
          return Response.json({
            id: p,
            object: "portfolio",
            created: 1,
            account: a,
            investor: "inv_" + "5".repeat(32),
            name: "Synthetic",
            reporting_currency: "INR",
          });
        return Response.json(
          {
            object: "history_import",
            account: a,
            portfolio: p,
            holdings: [
              {
                id: h,
                revision: 1,
                quantity: "4",
                derivation: {
                  kind: "amount_divided_by_nav",
                  original_amount: "10.02",
                  position_date: "2026-01-10",
                  nav: { amount: "2.505", currency: "INR", date: "2026-01-09" },
                  rounding: "half_even_18_decimal_places",
                  rounded: false,
                },
              },
            ],
          },
          { status: 201 },
        );
      },
    },
  });
  const portfolio = await c.portfolios.retrieve(p);
  const response = await portfolio.holdings.setCurrent(
    {
      source: { kind: "user", reference: "entry" },
      holdings: [
        {
          external_id: "entry",
          investment_account: "iac_" + "4".repeat(32),
          instrument: "ins_markets_scheme_11",
          observed_position: {
            date: "2026-01-10",
            current_value: { amount: "10.020", currency: "INR" },
          },
        },
      ],
    },
    { idempotencyKey: "entry-1" },
  );
  assert.equal(response.holdings[0].quantity, "4");
  assert.equal(
    request.url,
    `https://app.example/app-api/accounts/me/portfolios/${p}/holdings/current`,
  );
  assert.equal(request.options.headers["Idempotency-Key"], "entry-1");
  assert.equal(
    JSON.parse(request.options.body).holdings[0].observed_position.current_value
      .amount,
    "10.020",
  );
});

test("market retrieval rejects a different resource identity", async () => {
  const c = new Bharosa({
    baseUrl: "https://app.example",
    account: "me",
    transport: {
      send: async () =>
        Response.json({
          id: "999",
          name: "Synthetic",
          amc_id: "1",
          category: null,
          active: true,
          manager_ids: [],
        }),
    },
  });
  await assert.rejects(c.marketData.funds.retrieve("11"), {
    name: "InvalidResponseError",
  });
});
test("valuation rejects wrong position date and future NAV evidence", async () => {
  for (const patch of [
    { position_date: "2026-01-10" },
    { nav: { ...result.nav, date: "2026-01-12" } },
  ]) {
    const c = new Bharosa({
      baseUrl: "https://app.example",
      account: "me",
      transport: { send: async () => Response.json({ ...result, ...patch }) },
    });
    await assert.rejects(
      c.marketData.schemes.valuation("11", {
        units: "1.25",
        asOf: "2026-01-11",
        positionDate: "2026-01-11",
      }),
      { name: "InvalidResponseError" },
    );
  }
});

test("current holding receipts reject missing quantity and malformed conversion provenance", async () => {
  const p = "ptf_" + "1".repeat(32),
    a = "acct_" + "2".repeat(32),
    h = "hld_" + "3".repeat(32);
  const input = {
    source: { kind: "user", reference: "entry" },
    holdings: [
      {
        external_id: "entry",
        investment_account: "iac_" + "4".repeat(32),
        instrument: "ins_markets_scheme_11",
        observed_position: {
          date: "2026-01-10",
          current_value: { amount: "10.02", currency: "INR" },
        },
      },
    ],
  };
  const good = {
    id: h,
    revision: 1,
    quantity: "4",
    derivation: {
      kind: "amount_divided_by_nav",
      original_amount: "10.02",
      position_date: "2026-01-10",
      nav: { amount: "2.505", currency: "INR", date: "2026-01-09" },
      rounding: "half_even_18_decimal_places",
      rounded: false,
    },
  };
  for (const bad of [
    { id: h },
    {
      ...good,
      derivation: {
        ...good.derivation,
        nav: { amount: "2.505", currency: "INR", date: "2026-01-12" },
      },
    },
    { ...good, derivation: { ...good.derivation, original_amount: "99" } },
    { ...good, derivation: { kind: "supplied" } },
  ]) {
    const c = new Bharosa({
      baseUrl: "https://app.example",
      account: "me",
      transport: {
        send: async (url, r) =>
          r.method === "GET"
            ? Response.json({
                id: p,
                object: "portfolio",
                created: 1,
                account: a,
                investor: "inv_" + "5".repeat(32),
                name: "Synthetic",
                reporting_currency: "INR",
              })
            : Response.json(
                {
                  object: "history_import",
                  account: a,
                  portfolio: p,
                  holdings: [bad],
                },
                { status: 201 },
              ),
      },
    });
    const portfolio = await c.portfolios.retrieve(p);
    await assert.rejects(
      portfolio.holdings.setCurrent(input, { idempotencyKey: "entry" }),
      { name: "InvalidResponseError" },
    );
  }
});
