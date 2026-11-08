import { test } from "node:test";
import assert from "node:assert/strict";
import { Bharosa } from "../dist/index.mjs";
test("new fund methods retain constructor transport after caller config changes", async () => {
  const urls: string[] = [];
  const owner = {
    id: "7",
    name: "Synthetic",
    amc_id: null,
    category: null,
    active: true,
    manager_ids: [],
  };
  const portfolio = { id: "51", fund_id: "7", date: "2026-09-30" };
  const envelope = (data: unknown) => ({
    object: "market_snapshot",
    requested_date: "2026-10-01",
    observation_date: "2026-09-30",
    status: "available",
    data,
  });
  const config = {
    apiKey: "synthetic",
    baseUrl: "https://original.invalid",
    maxResponseBytes: 10000,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("Authorization"), "Bearer synthetic");
      assert.equal(headers.get("Bharosa-User-Authorization"), null);
      const url = new URL(String(input));
      urls.push(url.href);
      assert.equal(url.origin, "https://original.invalid");
      if (url.pathname.endsWith("/portfolios"))
        return Response.json(envelope(portfolio));
      if (url.pathname.endsWith("/holdings"))
        return Response.json(
          envelope({
            portfolio,
            holdings: {
              object: "list",
              data: [],
              has_more: false,
              next_cursor: null,
              source: "normalized_market_database",
            },
          }),
        );
      return Response.json(owner);
    },
  };
  const sdk = new Bharosa(config);
  config.baseUrl = "https://changed.invalid";
  config.apiKey = "changed-synthetic";
  config.maxResponseBytes = 1;
  config.fetch = async () => {
    throw Error("Must not use mutated caller transport");
  };
  const fund = await sdk.mutualFunds.retrieve("7");
  const selected = await fund.portfolio({ asOf: "2026-10-01" });
  assert.ok(selected);
  await selected.holdings();
  assert.equal(urls.length, 3);
});

test("new market methods snapshot legacy auth and do not forward delegated user headers", async () => {
  const config = {
    account: "acct_0123456789abcdef0123456789abcdef",
    auth: {
      type: "delegated_application" as const,
      apiKey: "original-key",
      userAccessToken: "original-user",
    },
    fetch: async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("Authorization"), "Bearer original-key");
      assert.equal(headers.get("Bharosa-User-Authorization"), null);
      return Response.json({
        id: "7",
        name: "Synthetic",
        amc_id: null,
        category: null,
        active: true,
        manager_ids: [],
      });
    },
  };
  const sdk = new Bharosa(config);
  config.auth.apiKey = "changed-key";
  config.auth.userAccessToken = "changed-user";
  // Per-call timeout options are independent; there is no constructor timeout/header option.
  await Promise.all([
    sdk.mutualFunds.retrieve("7", { timeoutMs: 1000 }),
    sdk.mutualFunds.retrieve("7", { timeoutMs: 2000 }),
  ]);
});
