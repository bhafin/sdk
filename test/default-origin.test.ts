import { test } from "node:test";
import assert from "node:assert/strict";
import { Bharosa, BharosaMarket, ValidationError } from "../dist/index.mjs";
const account = "acct_0123456789abcdef0123456789abcdef";
for (const market of [false, true]) {
  const label = market ? "BharosaMarket" : "Bharosa";
  const calls: Array<{url: string; init: RequestInit | undefined}> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({url: String(input), init});
    return Response.json(market ? {
      object: "market_snapshot", requested_date: "2026-08-01",
      observation_date: null, status: "missing", data: null,
    } : {id: account, object: "account", created: 0, primary_investor: null});
  };
  const config = market ? {apiKey: "synthetic-key", fetch: fetcher} : {
    account, auth: {type: "account_key" as const, apiKey: "synthetic-key"}, fetch: fetcher,
  };
  const construct = (extra: object = {}) => market
    ? Reflect.construct(BharosaMarket, [{...config, ...extra}]) as BharosaMarket
    : Reflect.construct(Bharosa, [{...config, ...extra}]) as Bharosa;
  const read = (c: Bharosa | BharosaMarket) => c instanceof Bharosa
    ? c.accounts.retrieve() : c.schemes.nav("11", {asOf: "2026-08-01"});
  const suffix = market ? "/v1/market-data/schemes/11/navs?as_of=2026-08-01"
    : `/v1/accounts/${account}`;
  test(`${label}: omitted and undefined URL use exact production origin`, async () => {
    for (const extra of [{}, {baseUrl: undefined}]) {
      await read(construct(extra));
      const call = calls.at(-1)!;
      assert.equal(call.url, "https://api.bharosa.finance" + suffix);
      assert.equal(new Headers(call.init?.headers).get("Authorization"), "Bearer synthetic-key");
      assert.equal(call.init?.redirect, "error");
    }
  });
  test(`${label}: explicit HTTPS and opted-in localhost overrides are preserved`, async () => {
    for (const [baseUrl, allowLocalhostHttp] of [
      ["https://synthetic.invalid", false], ["https://synthetic.invalid/", false],
      ["http://127.0.0.1:9876", true],
    ] as const) {
      await read(construct({baseUrl, allowLocalhostHttp}));
      assert.equal(calls.at(-1)!.url, baseUrl.replace(/\/$/, "") + suffix);
    }
  });
  test(`${label}: invalid explicit URL never falls back or sends credentials`, () => {
    const before = calls.length;
    for (const baseUrl of [null, "", false, 0, {}, [], "http://evil.invalid",
      "http://localhost:9876", "https://user:pass@evil.invalid", "https://api.bharosa.finance/evil",
      "https://api.bharosa.finance?host=evil.invalid", "https://api.bharosa.finance#evil",
      "https://api.bharosa.finance\\@evil.invalid", " https://api.bharosa.finance"]) {
      assert.throws(() => construct({baseUrl}), ValidationError);
    }
    assert.equal(calls.length, before);
  });
  test(`${label}: default does not relax credential or unknown-option validation`, () => {
    assert.throws(() => construct(market ? {apiKey: ""} : {auth: undefined}), ValidationError);
    assert.throws(() => construct({unexpected: true}), ValidationError);
    assert.throws(() => Reflect.construct(market ? BharosaMarket : Bharosa, [null]), ValidationError);
  });
}
test("caller-owned transport receives production URL without SDK auth headers", async () => {
  const sdk = new Bharosa({account, transport: {send: async (url, init) => {
    assert.equal(url, `https://api.bharosa.finance/v1/accounts/${account}`);
    assert.equal(new Headers(init.headers).get("Authorization"), null);
    return Response.json({id: account, object: "account", created: 0, primary_investor: null});
  }}});
  await sdk.accounts.retrieve();
});
