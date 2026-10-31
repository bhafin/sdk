import { test } from "node:test";
import assert from "node:assert/strict";
import { Bharosa, BharosaMarket } from "../dist/index.mjs";
import { createTransport } from "../dist/transport.cjs";
test("baseline analytics, valuation and references use key-only canonical paths", async () => {
  const paths: string[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const u = new URL(String(input));
    paths.push(u.pathname);
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer synthetic",
    );
    assert.equal(
      new Headers(init?.headers).get("Bharosa-User-Authorization"),
      null,
    );
    return Response.json(
      { error: { code: "synthetic_unavailable", message: "unavailable" } },
      { status: 503 },
    );
  };
  const clients = [
    new Bharosa({ apiKey: "synthetic", fetch: fetcher }).markets,
    new BharosaMarket({ apiKey: "synthetic", fetch: fetcher }),
  ];
  for (const client of clients) {
    await assert.rejects(
      client.schemes.performance.retrieve("11", {
        asOf: "2026-08-01",
        periods: ["1y"],
      }),
      { status: 503 },
    );
    await assert.rejects(
      client.categories.statistics.retrieve("equity", {
        asOf: "2026-08-01",
        metrics: ["return"],
      }),
      { status: 503 },
    );
    await assert.rejects(
      client.schemes.valuation("11", { units: "2", asOf: "2026-08-01" }),
      { status: 503 },
    );
    await assert.rejects(
      client.schemes.references({ instruments: ["ins_synthetic"] }),
      { status: 503 },
    );
  }
  assert.deepEqual(paths.slice(0, 4), [
    "/v1/market-data/schemes/11/performance",
    "/v1/market-data/categories/equity/statistics",
    "/v1/market-data/valuations",
    "/v1/market-data/schemes/references",
  ]);
});
test("expanded market surface still refuses private operations before transport", async () => {
  const call = createTransport(
    {
      apiKey: "synthetic",
      fetch: async () => {
        throw Error("must not send");
      },
    },
    true,
  );
  for (const id of [
    "retrieve_account",
    "list_portfolios",
    "list_holdings",
    "holding_position",
    "portfolio_asset_mix",
  ] as const)
    await assert.rejects(call(id as never), { code: "market_only_operation" });
});
