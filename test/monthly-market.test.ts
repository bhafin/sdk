import { test } from "node:test";
import assert from "node:assert/strict";
import { Bharosa } from "../dist/index.mjs";
test("monthly snapshot SDK uses scoped route and checks observation identity", async () => {
  let called = "";
  const client = new Bharosa({
    baseUrl: "https://api.example",
    account: "me",
    transport: {
      async send(url) {
        called = url;
        return Response.json({
          object: "market_snapshot",
          requested_date: "2026-08-01",
          observation_date: "2026-07-31",
          status: "available",
          data: {
            id: "1",
            scheme_id: "11",
            date: "2026-07-31",
            amount: "3.14",
            currency: "INR",
          },
        });
      },
    },
  });
  const surface = client.marketSnapshots;
  assert.ok(surface, "monthly market SDK surface is missing");
  const result = await surface.schemes.nav("11", { asOf: "2026-08-01" });
  assert.equal(result.status, "available");
  if (result.status !== "available") throw new Error("Expected observation");
  assert.equal(result.data.amount, "3.14");
  assert.equal(
    called,
    "https://api.example/v1/accounts/me/market-data/schemes/11/navs?as_of=2026-08-01",
  );
  await assert.rejects(surface.schemes.nav("12", { asOf: "2026-08-01" }));
});

test("monthly query validation precedes transport and missing responses remain explicit", async () => {
  let calls = 0;
  const client = new Bharosa({
    baseUrl: "https://api.example",
    account: "me",
    transport: {
      async send() {
        calls++;
        return Response.json({
          object: "market_snapshot",
          requested_date: "2026-08-01",
          observation_date: null,
          status: "missing",
          data: null,
        });
      },
    },
  });
  await assert.rejects(
    client.marketSnapshots.schemes.nav("11", { asOf: "2026-08-02" }),
  );
  assert.equal(calls, 0);
  assert.equal(
    (await client.marketSnapshots.schemes.nav("11", { asOf: "2026-08-01" }))
      .status,
    "missing",
  );
});
test("monthly holdings validate owner, portfolio and actual date", async () => {
  const portfolio = { id: "40", fund_id: "7", date: "2026-07-31" };
  const row = {
    id: "50",
    portfolio_id: "40",
    date: "2026-07-31",
    asset_type: "Equity",
    asset_id: "9",
    units: "1",
    value: { amount: "2.5", currency: "INR" },
  };
  const client = new Bharosa({
    baseUrl: "https://api.example",
    account: "me",
    transport: {
      async send() {
        return Response.json({
          object: "market_snapshot",
          requested_date: "2026-08-01",
          observation_date: "2026-07-31",
          status: "available",
          data: {
            portfolio,
            holdings: {
              object: "list",
              data: [row],
              has_more: false,
              next_cursor: null,
              source: "normalized_market_database",
            },
          },
        });
      },
    },
  });
  await client.marketSnapshots.funds.holdings("7", { asOf: "2026-08-01" });
  row.portfolio_id = "99";
  await assert.rejects(
    client.marketSnapshots.funds.holdings("7", { asOf: "2026-08-01" }),
  );
  row.portfolio_id = "40";
  portfolio.fund_id = "8";
  await assert.rejects(
    client.marketSnapshots.funds.holdings("7", { asOf: "2026-08-01" }),
  );
});
