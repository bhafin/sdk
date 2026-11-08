import { test } from "node:test";
import assert from "node:assert/strict";
import { Bharosa, InvalidResponseError } from "../dist/index.mjs";
const portfolio = { id: "51", fund_id: "7", date: "2026-09-30" };
const holding = {
  id: "2",
  portfolio_id: "51",
  date: "2026-09-30",
  asset_type: "CommonEquity",
  asset_id: "9",
  units: "1.0000",
  value: { amount: "1.00", currency: "INR" },
};
const page = {
  object: "list",
  data: [holding],
  has_more: false,
  next_cursor: null,
  source: "normalized_market_database",
};
const envelope = (data: unknown) => ({
  object: "market_snapshot",
  requested_date: "2026-10-01",
  observation_date: "2026-09-30",
  status: "available",
  data,
});
for (const [name, change] of [
  [
    "wrong fund",
    (x: any) => {
      x.data.portfolio.fund_id = "8";
    },
  ],
  [
    "wrong portfolio",
    (x: any) => {
      x.data.portfolio.id = "52";
    },
  ],
  [
    "wrong holding owner",
    (x: any) => {
      x.data.holdings.data[0].portfolio_id = "52";
    },
  ],
  [
    "wrong holding date",
    (x: any) => {
      x.data.holdings.data[0].date = "2026-09-29";
    },
  ],
  [
    "changed observation date",
    (x: any) => {
      x.observation_date = "2026-09-29";
      x.data.portfolio.date = "2026-09-29";
      x.data.holdings.data[0].date = "2026-09-29";
    },
  ],
  [
    "missing selected portfolio",
    (x: any) => {
      x.status = "missing";
      x.observation_date = null;
      x.data = null;
    },
  ],
] as const)
  test(`bound holdings rejects ${name}`, async () => {
    const sdk = new Bharosa({
      apiKey: "synthetic",
      fetch: async (input) => {
        if (!String(input).includes("/holdings"))
          return Response.json(envelope(portfolio));
        const result = structuredClone(envelope({ portfolio, holdings: page }));
        change(result);
        return Response.json(result);
      },
    });
    const selected = await sdk.mutualFunds
      .fromId("7")
      .portfolio({ asOf: "2026-10-01" });
    assert.ok(selected);
    await assert.rejects(selected.holdings(), InvalidResponseError);
  });
test("mutating displayed portfolio does not retarget bound holdings; cancellation stays local", async () => {
  let calls = 0;
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async (input) => {
      calls++;
      const url = new URL(String(input));
      if (url.pathname.endsWith("/holdings")) {
        assert.equal(url.searchParams.get("portfolio_id"), "51");
        assert.equal(url.searchParams.get("as_of"), "2026-10-01");
        return Response.json(envelope({ portfolio, holdings: page }));
      }
      return Response.json(envelope(portfolio));
    },
  });
  const selected = await sdk.mutualFunds
    .fromId("7")
    .portfolio({ asOf: "2026-10-01" });
  assert.ok(selected);
  Object.assign(selected, { id: "52", fund_id: "8", date: "2026-08-31" });
  assert.deepEqual(await selected.holdings(), page);
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(selected.holdings({}, { signal: abort.signal }));
  assert.equal(calls, 2);
});
