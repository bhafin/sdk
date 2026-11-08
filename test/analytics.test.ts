import { test } from "node:test";
import assert from "node:assert/strict";
import { Bharosa } from "../dist/index.mjs";
test("Growth slice exposes only return methods and rejects deferred metrics before transport", async () => {
  let calls = 0;
  const client = new Bharosa({
    baseUrl: "https://fixture.invalid",
    account: "me",
    auth: { type: "account_key", apiKey: "synthetic" },
    fetch: async () => {
      calls++;
      throw new Error("sentinel");
    },
  });
  assert.equal("aum" in client.mutualFunds, true);
  assert.equal("aum" in client.mutualFundSchemes, false);
  assert.equal("performance" in client.portfolios, false);
  assert.throws(
    () =>
      client.fundCategories.statistics.retrieve("equity", {
        asOf: "2026-10-01",
        metrics: ["aum"] as never,
      }),
    { name: "ValidationError" },
  );
  assert.equal(calls, 0);
  await assert.rejects(
    client.mutualFundSchemes.performance.retrieve("11", {
      asOf: "2026-10-01",
      periods: ["1y"],
    }),
    { kind: "transport" },
  );
  await assert.rejects(
    client.fundCategories.statistics.retrieve("equity", {
      asOf: "2026-10-01",
      periods: ["1y"],
    }),
    { kind: "transport" },
  );
  assert.equal(calls, 2);
});
