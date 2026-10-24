import { test } from "node:test";
import assert from "node:assert/strict";
import { Bharosa } from "../dist/index.mjs";

test("resource names delegate to monthly transports and preserve scheme versus fund IDs", async () => {
  const urls: string[] = [];
  const client = new Bharosa({
    baseUrl: "https://api.example",
    account: "me",
    transport: {
      async send(url) {
        urls.push(url);
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
  const schemes = Reflect.get(client, "mutualFundSchemes");
  assert.ok(schemes, "resource-centred scheme methods required");
  await schemes.navs.retrieve("11", { asOf: "2026-08-01" });
  await schemes.expenseRatios.retrieve("11", { asOf: "2026-08-01" });
  const portfolios = Reflect.get(client.mutualFunds, "portfolios");
  assert.ok(portfolios);
  await portfolios.retrieve("7", { asOf: "2026-08-01" });
  await portfolios.holdings.list("7", { asOf: "2026-08-01", limit: 2 });
  assert.deepEqual(
    urls.map((u) => new URL(u).pathname),
    [
      "/v1/accounts/me/market-data/schemes/11/navs",
      "/v1/accounts/me/market-data/schemes/11/expense-ratios",
      "/v1/accounts/me/market-data/funds/7/portfolios",
      "/v1/accounts/me/market-data/funds/7/holdings",
    ],
  );
});

test("portfolio plural filters encode repeated keys and reject invalid combinations before transport", async () => {
  const urls: string[] = [];
  const client = new Bharosa({
    baseUrl: "https://api.example",
    account: "me",
    transport: {
      async send(url) {
        urls.push(url);
        return Response.json({
          object: "list",
          data: [],
          has_more: false,
          url: "/v1/accounts/me/portfolios",
        });
      },
    },
  });
  const a = "clt_" + "a".repeat(32),
    b = "clt_" + "b".repeat(32);
  const call = (p: unknown) =>
    Reflect.apply(client.portfolios.list, client.portfolios, [p]);
  await call({ client_ids: [a, b] });
  assert.deepEqual(new URL(urls[0]!).searchParams.getAll("client_ids"), [a, b]);
  for (const p of [
    { client_ids: [] },
    { investor_ids: [] },
    { client_ids: [a], investor_ids: ["inv_" + "a".repeat(32)] },
    { client: a, client_ids: [b] },
  ])
    await assert.rejects(call(p));
  assert.equal(urls.length, 1);
  await client.accounts.retrieve().catch(() => {});
  assert.equal(new URL(urls[1]!).pathname, "/v1/accounts/me");
});
