import { test } from "node:test";
import assert from "node:assert/strict";
import { valid } from "../dist/validate.cjs";
import { Bharosa, InvalidResponseError } from "../dist/index.mjs";

test("oneOf requires exactly one branch and retains sibling constraints", () => {
  const union = { oneOf: [{ type: "string" }, { type: "number" }] };
  assert.equal(valid(union, "hello"), true);
  assert.equal(valid(union, 1), true);
  assert.equal(valid(union, null), false);
  assert.equal(valid({ oneOf: [] }, 1), false);
  assert.equal(
    valid({ oneOf: [{ type: "integer" }, { type: "number" }] }, 1),
    false,
  );
  assert.equal(valid({ ...union, enum: ["allowed"] }, "other"), false);
  assert.equal(valid({ ...union, enum: ["allowed"] }, "allowed"), true);
  assert.equal(valid({ anyOf: [{ type: "null" }, union] }, {}), false);
  assert.equal(
    valid({ type: "object", properties: { value: union } }, { value: {} }),
    false,
  );
});

const aum = {
  object: "market_snapshot",
  requested_date: "2026-10-01",
  observation_date: "2026-09-30",
  status: "available",
  data: {
    fund_id: "20",
    date: "2026-09-30",
    amount: "10.01",
    currency: "INR",
    unit: "rupee",
    scope: "fund",
    basis: "stored_fund_portfolio_value",
    source: {
      table: "portfolios",
      field: "value_cents",
      portfolio_id: "40",
      date: "2026-09-30",
      source_unit: "paise",
    },
  },
  quality: { status: "fresh", age_days: 1, limit_days: 62 },
};
test("standalone AUM response rejects malformed union members rather than returning unsafe data", async () => {
  for (const mutate of [
    (x: any) => {
      x.data.amount = "-1";
    },
    (x: any) => {
      x.data.amount = 1;
    },
    (x: any) => {
      x.data.currency = "USD";
    },
    (x: any) => {
      delete x.quality;
    },
  ]) {
    const response = { ...structuredClone(aum), fund_id: "20", source_cutoff: "2026-10-01", source_version: "synthetic", history_basis: "current_source_vintage" };
    mutate(response);
    const sdk = new Bharosa({
      apiKey: "synthetic",
      fetch: async () => Response.json(response),
    });
    await assert.rejects(
      sdk.markets.funds.aum.retrieve("20", { asOf: "2026-10-01" }),
      InvalidResponseError,
    );
  }
});
test("fund resource rejects malformed nested AUM; valid zero and missing remain accepted", async () => {
  const response = {
    object: "market_snapshot",
    requested_date: "2026-10-01",
    observation_date: "2026-09-30",
    status: "available",
    data: {
      id: "40",
      fund_id: "20",
      date: "2026-09-30",
      aum: structuredClone(aum),
    },
  };
  const sdk = new Bharosa({
    apiKey: "synthetic",
    fetch: async () => Response.json(response),
  });
  response.data.aum.data.amount = "0";
  assert.equal(
    (await sdk.mutualFunds.fromId("20").portfolio({ asOf: "2026-10-01" }))?.aum
      ?.data?.amount,
    "0",
  );
  response.data.aum.data.amount = "-1";
  await assert.rejects(
    sdk.mutualFunds.fromId("20").portfolio({ asOf: "2026-10-01" }),
    InvalidResponseError,
  );
  const missing = new Bharosa({
    apiKey: "synthetic",
    fetch: async () =>
      Response.json({
        object: "market_snapshot",
        requested_date: "2026-10-01",
        observation_date: null,
        status: "missing",
        data: null,
      }),
  });
  assert.equal(
    await missing.mutualFunds.fromId("20").portfolio({ asOf: "2026-10-01" }),
    null,
  );
});
