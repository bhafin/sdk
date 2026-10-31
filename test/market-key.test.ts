import { test } from "node:test";
import assert from "node:assert/strict";
import { BharosaMarket } from "../dist/index.mjs";
test("market credential uses only account-independent monthly routes", async () => {
  let calls = 0;
  const client = new BharosaMarket({
    baseUrl: "https://api.example",
    apiKey: "synthetic-key",
    fetch: async (input, init) => {
      calls++;
      assert.equal(
        String(input),
        "https://api.example/v1/market-data/schemes/11/navs?as_of=2026-08-01",
      );
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer synthetic-key",
      );
      assert.equal(
        new Headers(init?.headers).get("Bharosa-User-Authorization"),
        null,
      );
      return Response.json({
        object: "market_snapshot",
        requested_date: "2026-08-01",
        observation_date: null,
        status: "missing",
        data: null,
      });
    },
  });
  assert.equal(
    (await client.schemes.nav("11", { asOf: "2026-08-01" })).status,
    "missing",
  );
  await assert.rejects(client.schemes.nav("11", { asOf: "2026-08-02" }));
  assert.equal(calls, 1);
  assert.equal("accounts" in client, false);
  assert.equal("valuation" in client.schemes, true);
});
