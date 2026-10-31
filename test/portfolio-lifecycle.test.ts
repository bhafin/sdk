import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Bharosa,
  ValidationError,
  InvalidResponseError,
} from "../dist/index.mjs";
import { getFixture } from "./fixtures.js";
const account = "acct_0123456789abcdef0123456789abcdef";
const portfolio = "ptf_0123456789abcdef0123456789abcdef";
const response = {
  id: portfolio,
  object: "portfolio",
  created: 0,
  account,
  investor: "inv_0123456789abcdef0123456789abcdef",
  name: "Retirement",
  reporting_currency: "INR",
};
test("name-only update sends typed compare-and-set and idempotency, and rejects mismatched receipts", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let reply = response;
  const sdk = new Bharosa({
    baseUrl: "https://synthetic.invalid",
    account,
    transport: {
      send: async (url, init) => {
        calls.push({ url, init });
        return Response.json(reply);
      },
    },
  });
  const changed = await sdk.portfolios.update(
    portfolio,
    { name: " Retirement ", expected_name: "Old name" },
    { idempotencyKey: "rename-1" },
  );
  assert.equal(changed.name, "Retirement");
  assert.equal(typeof changed.currentSnapshot, "function");
  assert.equal(
    calls[0].url,
    `https://synthetic.invalid/v1/accounts/${account}/portfolios/${portfolio}`,
  );
  assert.equal(calls[0].init.method, "POST");
  assert.equal(
    new Headers(calls[0].init.headers).get("Idempotency-Key"),
    "rename-1",
  );
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    name: " Retirement ",
    expected_name: "Old name",
  });
  for (const name of ["", "  ", "x".repeat(201)])
    await assert.rejects(
      sdk.portfolios.update(
        portfolio,
        { name, expected_name: "Old name" },
        { idempotencyKey: "invalid" },
      ),
      ValidationError,
    );
  assert.equal(calls.length, 1);
  reply = { ...response, id: "ptf_11111111111111111111111111111111" };
  await assert.rejects(
    sdk.portfolios.update(
      portfolio,
      { name: "Retirement", expected_name: "Old name" },
      { idempotencyKey: "wrong-receipt" },
    ),
    InvalidResponseError,
  );
});
test("empty creation accepts a real zero-position snapshot response", async () => {
  const fixture = getFixture("create_portfolio");
  const result = structuredClone(fixture.response);
  result.positions = [];
  result.instruments = [];
  result.snapshot.position_count = 0;
  result.total_current_value = { amount: "0", currency: "INR" };
  const sdk = new Bharosa({
    baseUrl: "https://synthetic.invalid",
    account: result.portfolio.account,
    transport: {
      send: async (_url, init) => {
        assert.deepEqual(JSON.parse(String(init.body)).positions, []);
        return Response.json(result, { status: 201 });
      },
    },
  });
  const value = await sdk.portfolios.create(
    { ...fixture.request, positions: [] },
    { idempotencyKey: "empty-create" },
  );
  assert.equal(value.positions.length, 0);
  assert.equal(value.total_current_value?.amount, "0");
});
