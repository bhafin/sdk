import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Bharosa,
  InvalidResponseError,
  ValidationError,
} from "../dist/index.mjs";
const fund = {
  id: "7",
  name: "Same Growth Name",
  amc_id: null,
  category: null,
  active: true,
  manager_ids: [],
};
const scheme = {
  id: "11",
  fund_id: "7",
  fund_name: fund.name,
  amfi_code: null,
  isin: null,
  plan_code: 4,
  option_code: 0,
  status_code: 0,
};
const page = (data: unknown[], more = false) => ({
  object: "list",
  data,
  has_more: more,
  next_cursor: more ? "11" : null,
  source: "normalized_market_database",
});
test("distinct parent search and paginated schemes bind immutable identities with ordinary promises", async () => {
  const seen: string[] = [];
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async (input, init) => {
      const u = new URL(String(input));
      seen.push(u.pathname + u.search);
      assert.equal(
        new Headers(init?.headers).get("Bharosa-User-Authorization"),
        null,
      );
      if (u.pathname.endsWith("/funds/search"))
        return Response.json(page([fund]));
      if (u.pathname.endsWith("/funds/7/schemes"))
        return Response.json(page([scheme]));
      if (u.pathname.endsWith("/schemes/11/navs"))
        return Response.json({
          object: "market_snapshot",
          requested_date: "2026-10-01",
          observation_date: null,
          status: "missing",
          data: null,
        });
      if (u.pathname.endsWith("/funds/7")) return Response.json(fund);
      throw Error(u.pathname);
    },
  });
  const parent = (await sdk.mutualFunds.search({ query: "Same" })).data[0]!;
  parent.id = "99";
  const pending = parent.schemes({
    limit: 1,
    startingAfter: "9",
    plan: 4,
    option: 0,
  });
  assert.ok(pending instanceof Promise);
  const child = (await pending).data[0]!;
  assert.equal(child.plan, "Direct");
  assert.equal(child.option, "Growth");
  child.id = "999";
  child.mutual_fund_id = "999";
  assert.equal((await child.fund())!.id, "7");
  assert.equal((await child.nav({ asOf: "2026-10-01" })).status, "missing");
  assert.equal(Object.hasOwn(parent.portfolio, "assetMix"), false);
  assert.equal("then" in parent, false);
  assert.ok(seen.some((x) => x.includes("starting_after=9")));
  assert.ok(!seen.some((x) => x.includes("999")));
});
test("scheme retrieval identity, mixed parent pages, numeric order and missing parent fail closed", async () => {
  for (const response of [{ ...scheme, id: "12" }]) {
    const sdk = new Bharosa({
      apiKey: "synthetic",
      fetch: async () => Response.json(response),
    });
    await assert.rejects(
      sdk.mutualFundSchemes.retrieve("11"),
      InvalidResponseError,
    );
  }
  for (const response of [
    page([{ ...scheme, fund_id: "8" }]),
    page([{ ...scheme, id: "9" }]),
    page([scheme, scheme]),
  ]) {
    const sdk = new Bharosa({
      apiKey: "synthetic",
      fetch: async () => Response.json(response),
    });
    await assert.rejects(
      sdk.mutualFunds.fromId("7").schemes({ startingAfter: "9" }),
      InvalidResponseError,
    );
  }
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async () =>
      Response.json({ ...scheme, plan_code: 99, option_code: null }),
  });
  const child = await sdk.mutualFundSchemes.retrieve("11");
  assert.equal(child.plan, null);
  assert.equal(child.option, null);
});
test("invalid catalog inputs never reach transport", async () => {
  let sent = 0;
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async () => {
      sent++;
      throw Error("unexpected");
    },
  });
  for (const id of ["0", "-1", "ins_7", "9223372036854775808"])
    await assert.rejects(sdk.mutualFundSchemes.retrieve(id), ValidationError);
  await assert.rejects(sdk.mutualFunds.search({ query: "x" }), ValidationError);
  await assert.rejects(
    sdk.mutualFunds.fromId("7").schemes({ fund: "9" } as never),
    ValidationError,
  );
  assert.equal(sent, 0);
});
test("scheme search preserves explicit parent and labels; absent parent is null without fetching", async () => {
  const { readFileSync } = await import("node:fs");
  const contract = JSON.parse(
    readFileSync(
      new URL("./market-search.openapi.json", import.meta.url),
      "utf8",
    ),
  );
  const response =
    contract.paths["/v1/market-data/schemes/search"].get.responses["200"]
      .content["application/json"].example;
  for (const parent of [null, "7"]) {
    let called = 0;
    const result = structuredClone(response);
    result.data[0].mutual_fund_id = parent;
    const sdk = new Bharosa({
      apiKey: "synthetic",
      fetch: async (input) => {
        called++;
        return new URL(String(input)).pathname.endsWith("/search")
          ? Response.json(result)
          : Response.json(
              { error: { code: "resource_missing", message: "missing" } },
              { status: 404 },
            );
      },
    });
    const child = (await sdk.mutualFundSchemes.search({ query: "equity" }))
      .data[0]!;
    assert.equal(child.mutual_fund_id, parent);
    assert.equal(child.plan, result.data[0].plan_label);
    assert.equal(child.option, result.data[0].option_label);
    if (parent === null) {
      assert.equal(await child.fund(), null);
      assert.equal(called, 1);
    } else await assert.rejects(child.fund(), { status: 404 });
  }
});
