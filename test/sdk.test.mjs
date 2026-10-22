import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
  Bharosa,
  ValidationError,
  APIError,
  TransportError,
  TimeoutError,
  AbortError,
  InvalidResponseError,
} from "../dist/index.mjs";
import validation from "../dist/validate.cjs";
import contract from "../dist/contract.cjs";
const fixtures = JSON.parse(
  fs.readFileSync(new URL("./http-examples.json", import.meta.url)),
);
const futures = JSON.parse(
  fs.readFileSync(new URL("./future-enums.json", import.meta.url)),
);
const account = "acct_0123456789abcdef0123456789abcdef";
const config = {
  baseUrl: "https://synthetic.invalid",
  account,
  auth: { type: "account_key", apiKey: "synthetic-secret-only" },
};
const res = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Request-Id": "req_synthetic",
      ...headers,
    },
  });
const failure = (status, code = "temporary", headers = {}) =>
  res(
    {
      error: {
        type: status >= 500 ? "api_error" : "invalid_request_error",
        code,
        message: "DO NOT EXPOSE synthetic-secret-only",
        param: null,
        request_id: "req_synthetic",
      },
    },
    status,
    headers,
  );
const mapping = {
  retrieve_account: ["accounts", "retrieve"],
  list_clients: ["clients", "list"],
  retrieve_client: ["clients", "retrieve"],
  list_investors: ["investors", "list"],
  retrieve_investor: ["investors", "retrieve"],
  create_investor: ["investors", "create"],
  update_investor: ["investors", "update"],
  list_portfolios: ["portfolios", "list"],
  retrieve_portfolio: ["portfolios", "retrieve"],
  create_portfolio: ["portfolios", "create"],
  search_funds: ["mutualFunds", "search"],
  fund_references: ["mutualFunds", "references"],
  current_snapshot: ["portfolios", "snapshots", "retrieveCurrent"],
  replace_snapshot: ["portfolios", "snapshots", "create"],
};
async function invoke(client, f, opts = {}) {
  const id = f.operation_id;
  if (
    [
      "import_history",
      "retrieve_history",
      "history_capabilities",
      "list_holdings",
      "retrieve_holding",
      "holding_position",
    ].includes(id)
  ) {
    const p = await client.portfolios.retrieve(
      "ptf_0123456789abcdef0123456789abcdef",
    );
    if (id === "import_history")
      return p.history.import(f.request, {
        idempotencyKey: "fixture-key",
        ...opts,
      });
    if (id === "retrieve_history") return p.history.retrieve(opts);
    if (id === "history_capabilities")
      return p.history.canReconstruct("2026-01-10", opts);
    if (id === "list_holdings") return p.holdings.list({}, opts);
    const h = await p.holdings.retrieve(
      "hld_0123456789abcdef0123456789abcdef",
      opts,
    );
    return id === "retrieve_holding" ? h : h.positionOn("2026-01-10", opts);
  }

  if (["asset_mix", "sector_mix", "issuer_mix"].includes(id)) {
    const p = f.request.portfolio;
    return client.portfolios
      .fromPositions({
        valuationDate: p.valuation_date,
        currency: p.currency,
        positions: p.positions,
      })
      [id.replace("_mix", "Mix")]({ asOf: f.request.as_of }, opts);
  }
  const args = [];
  const p = contract.operations[id].parameters.find(
    (p) => p.in === "path" && p.name !== "account",
  );
  if (p)
    args.push(
      p.name === "client"
        ? "clt_0123456789abcdef0123456789abcdef"
        : p.name === "investor"
          ? "inv_0123456789abcdef0123456789abcdef"
          : "ptf_0123456789abcdef0123456789abcdef",
    );
  if (f.request) args.push(structuredClone(f.request));
  if (id.startsWith("list_")) args.push({ limit: 10 });
  if (id === "search_funds") args.push({ query: "Example", limit: 10 });
  if (id === "fund_references")
    args.push({
      instruments: f.response.data
        .map((x) => x.instrument.id)
        .concat(f.response.missing),
    });
  args.push({
    ...(f.request ? { idempotencyKey: "fixture-key" } : {}),
    ...opts,
  });
  const path = mapping[id];
  let target = client;
  for (const name of path.slice(0, -1)) target = target[name];
  return target[path.at(-1)](...args);
}
for (const f of fixtures)
  test("operation " + f.operation_id, async () => {
    let called = 0;
    const c = new Bharosa({
      ...config,
      fetch: async (url, init) => {
        called++;
        if (
          f.operation_id.includes("history") ||
          ["list_holdings", "retrieve_holding", "holding_position"].includes(
            f.operation_id,
          )
        ) {
          if (url.endsWith("/portfolios/ptf_0123456789abcdef0123456789abcdef"))
            return res(
              fixtures.find((x) => x.operation_id === "retrieve_portfolio")
                .response,
            );
          if (
            f.operation_id === "holding_position" &&
            url.endsWith("/holdings/hld_0123456789abcdef0123456789abcdef")
          )
            return res(
              fixtures.find((x) => x.operation_id === "retrieve_holding")
                .response,
            );
        }

        assert.ok(url.startsWith(config.baseUrl + "/v1/accounts/" + account));
        assert.equal(init.method, f.method);
        assert.equal(init.redirect, "error");
        assert.equal(init.credentials, "omit");
        assert.equal(init.cache, "no-store");
        assert.equal(
          init.headers.Authorization,
          "Bearer synthetic-secret-only",
        );
        if (f.request) assert.deepEqual(JSON.parse(init.body), f.request);
        return res(f.response, f.status);
      },
    });
    assert.deepEqual(await invoke(c, f), f.response);
    assert.equal(
      called,
      f.operation_id === "holding_position"
        ? 3
        : [
              "import_history",
              "retrieve_history",
              "history_capabilities",
              "list_holdings",
              "retrieve_holding",
            ].includes(f.operation_id)
          ? 2
          : 1,
    );
  });
for (const c of futures.cases)
  test(c.name, () =>
    assert.equal(
      validation.valid(contract.schemas[c.schema], c.value),
      c.valid,
    ),
  );
test("origin and auth reject unsafe inputs", () => {
  for (const baseUrl of [
    "http://example.com",
    "https://host/path",
    "https://host?x",
    "https://host#",
    "https://user:pass@host",
    "https://host\\@evil",
    "https://host/../",
    "http://127.1",
    "http://2130706433",
    " https://host",
    "https://HOST",
    "https://host:443",
  ])
    assert.throws(() => new Bharosa({ ...config, baseUrl }), ValidationError);
  for (const baseUrl of [
    "http://localhost:1234",
    "http://127.0.0.1:1234",
    "http://[::1]:1234",
  ])
    assert.doesNotThrow(
      () => new Bharosa({ ...config, baseUrl, allowLocalhostHttp: true }),
    );
  for (const auth of [
    { type: "account_key", apiKey: "x", userAccessToken: "y" },
    { type: "delegated_application", apiKey: "x" },
    { type: "unknown", apiKey: "x" },
    { type: "account_key", apiKey: "x\ny" },
  ])
    assert.throws(() => new Bharosa({ ...config, auth }), ValidationError);
  assert.throws(
    () => new Bharosa({ ...config, account: "../../evil" }),
    ValidationError,
  );
});
test("immutable account and auth isolation", async () => {
  const sent = [];
  const cfg = {
    ...config,
    auth: { ...config.auth },
    fetch: async (url, init) => {
      sent.push([url, init.headers]);
      return res(fixtures[0].response);
    },
  };
  const a = new Bharosa(cfg);
  cfg.auth.apiKey = "changed";
  cfg.account = "changed";
  assert.ok(Object.isFrozen(a) && Object.isFrozen(a.portfolios.snapshots));
  await a.accounts.retrieve();
  const b = new Bharosa({
    ...config,
    auth: {
      type: "delegated_application",
      apiKey: "synthetic-app-key",
      userAccessToken: "synthetic-user-token",
    },
    fetch: cfg.fetch,
  });
  await b.accounts.retrieve();
  assert.equal(sent[0][1].Authorization, "Bearer synthetic-secret-only");
  assert.equal(
    sent[1][1]["Bharosa-User-Authorization"],
    "Bearer synthetic-user-token",
  );
  assert.ok(!JSON.stringify(a).includes("synthetic-secret"));
});
test("request validation and no credential override", async () => {
  const c = new Bharosa({
    ...config,
    fetch: () => {
      throw Error("must not send");
    },
  });
  for (const o of [
    { headers: { Authorization: "x" } },
    { timeoutMs: 0 },
    { maxRetries: 3 },
    { account: "me" },
    { idempotencyKey: "a b" },
  ])
    await assert.rejects(c.accounts.retrieve(o), ValidationError);
  await assert.rejects(
    c.investors.create({ name: "x", relationship_to_owner: "other" }),
    ValidationError,
  );
  await assert.rejects(
    c.investors.create(undefined, { idempotencyKey: "key" }),
    ValidationError,
  );
  await assert.rejects(
    c.investors.update("inv_0123456789abcdef0123456789abcdef", {}, {}),
    ValidationError,
  );
  await assert.rejects(
    c.investors.update(
      "inv_0123456789abcdef0123456789abcdef",
      { name: "x" },
      { maxRetries: 1 },
    ),
    ValidationError,
  );
  const f = fixtures.find((x) => x.operation_id === "create_portfolio");
  for (const value of [1, "1e3", "01", "-1", "1.1234567890123456789"]) {
    const body = structuredClone(f.request);
    body.positions[0].current_value = value;
    await assert.rejects(
      c.portfolios.create(body, { idempotencyKey: "k" }),
      ValidationError,
    );
  }
});
test("unknown response fields and future categories preserved", async () => {
  const value = { ...futures.cases[0].value, new_field: { opaque: true } };
  const c = new Bharosa({ ...config, fetch: async () => res(value) });
  assert.deepEqual(await c.investors.retrieve(value.id), value);
});
test("query mapping and encoding", async () => {
  let url;
  const c = new Bharosa({
    ...config,
    fetch: async (u) => {
      url = u;
      return res(
        fixtures.find((f) => f.operation_id === "search_funds").response,
      );
    },
  });
  await c.mutualFunds.search({ query: "A & ? / %", limit: 2 });
  assert.equal(new URL(url).searchParams.get("query"), "A & ? / %");
  const d = new Bharosa({
    ...config,
    fetch: async (u) => {
      url = u;
      return res(
        fixtures.find((f) => f.operation_id === "list_investors").response,
      );
    },
  });
  await d.investors.list({
    startingAfter: "inv_0123456789abcdef0123456789abcdef",
  });
  assert.ok(url.includes("starting_after="));
  assert.ok(!url.includes("startingAfter"));
});
test("same serialized body and key across transport retry", async () => {
  const f = fixtures.find((f) => f.operation_id === "create_investor");
  const calls = [];
  const body = structuredClone(f.request);
  const c = new Bharosa({
    ...config,
    fetch: async (u, i) => {
      calls.push(i);
      if (calls.length === 1) {
        body.name = "changed";
        throw Error("synthetic-secret-only");
      }
      return res(f.response, f.status);
    },
  });
  await c.investors.create(body, {
    idempotencyKey: "fixed-key",
    maxRetries: 1,
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].body, calls[1].body);
  assert.equal(
    calls[0].headers["Idempotency-Key"],
    calls[1].headers["Idempotency-Key"],
  );
});
for (const status of [408, 429, 502, 503, 504])
  test("retry status " + status, async () => {
    let n = 0;
    const c = new Bharosa({
      ...config,
      fetch: async () =>
        ++n === 1 ? failure(status) : res(fixtures[0].response),
    });
    await c.accounts.retrieve({ maxRetries: 1 });
    assert.equal(n, 2);
  });
for (const status of [400, 401, 403, 404, 409, 500])
  test("no retry status " + status, async () => {
    let n = 0;
    const c = new Bharosa({
      ...config,
      fetch: async () => {
        n++;
        return failure(status, "snapshot_conflict");
      },
    });
    await assert.rejects(c.accounts.retrieve({ maxRetries: 2 }), APIError);
    assert.equal(n, 1);
  });
test("request in progress retries only with stable key", async () => {
  let n = 0;
  const f = fixtures.find((f) => f.operation_id === "create_investor");
  const c = new Bharosa({
    ...config,
    fetch: async () =>
      ++n === 1 ? failure(409, "request_in_progress") : res(f.response, 201),
  });
  await invoke(c, f, { maxRetries: 1 });
  assert.equal(n, 2);
});
test("timeout covers backoff", async () => {
  const c = new Bharosa({
    ...config,
    fetch: async () => failure(429, "rate_limit", { "Retry-After": "100" }),
  });
  await assert.rejects(
    c.accounts.retrieve({ maxRetries: 2, timeoutMs: 15 }),
    TimeoutError,
  );
});
test("timeout and cancellation interrupt hung network", async () => {
  const c = new Bharosa({ ...config, fetch: () => new Promise(() => {}) });
  await assert.rejects(c.accounts.retrieve({ timeoutMs: 10 }), TimeoutError);
  const ac = new AbortController();
  const promise = c.accounts.retrieve({ signal: ac.signal });
  ac.abort("synthetic-secret-only");
  await assert.rejects(
    promise,
    (e) =>
      e instanceof AbortError && !String(e).includes("synthetic-secret-only"),
  );
});
test("abort before dispatch and mutation uncertainty", async () => {
  const c = new Bharosa({
    ...config,
    fetch: async () => {
      throw Error("synthetic-secret-only");
    },
  });
  const f = fixtures.find((f) => f.operation_id === "create_investor");
  await assert.rejects(
    invoke(c, f),
    (e) =>
      e instanceof TransportError &&
      e.outcome === "unknown" &&
      !JSON.stringify(e).includes("synthetic-secret-only"),
  );
  const ac = new AbortController();
  ac.abort();
  await assert.rejects(
    invoke(c, f, { signal: ac.signal }),
    (e) => e instanceof AbortError && e.outcome === "not_sent",
  );
});
test("timeout interrupts stream and cancels reader", async () => {
  let cancelled = false;
  const c = new Bharosa({
    ...config,
    fetch: async () =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new TextEncoder().encode("{"));
          },
          cancel() {
            cancelled = true;
          },
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
  });
  await assert.rejects(c.accounts.retrieve({ timeoutMs: 10 }), TimeoutError);
  assert.equal(cancelled, true);
});
test("malformed, oversized, wrong discriminators and redirects rejected", async () => {
  const variants = [
    new Response("{", { headers: { "Content-Type": "application/json" } }),
    new Response("bad", { headers: { "Content-Type": "text/html" } }),
    res({ ...fixtures[0].response, object: "wrong" }),
    new Response(null, {
      status: 302,
      headers: { Location: "https://evil.invalid" },
    }),
    res({
      ...fixtures[0].response,
      id: "acct_11111111111111111111111111111111",
    }),
  ];
  for (const r of variants) {
    const c = new Bharosa({ ...config, fetch: async () => r });
    await assert.rejects(c.accounts.retrieve(), InvalidResponseError);
  }
  const c = new Bharosa({
    ...config,
    maxResponseBytes: 1,
    fetch: async () => res(fixtures[0].response),
  });
  await assert.rejects(c.accounts.retrieve(), InvalidResponseError);
});
test("redacted API errors and request ID consistency", async () => {
  const c = new Bharosa({
    ...config,
    fetch: async () => failure(401, "authentication_required"),
  });
  await assert.rejects(
    c.accounts.retrieve(),
    (e) =>
      e instanceof APIError &&
      e.requestId === "req_synthetic" &&
      e.status === 401 &&
      !JSON.stringify(e).includes("synthetic-secret-only") &&
      !e.message.includes("DO NOT EXPOSE"),
  );
  const d = new Bharosa({
    ...config,
    fetch: async () => failure(401, "bad", { "Request-Id": "other" }),
  });
  await assert.rejects(d.accounts.retrieve(), InvalidResponseError);
});
test("snapshot links and exact decimal totals", async () => {
  const f = fixtures.find((f) => f.operation_id === "current_snapshot");
  for (const mutate of [
    (v) => (v.total_current_value.amount = "0"),
    (v) => v.snapshot.position_count++,
    (v) =>
      (v.investment_account.latest_snapshot =
        "psn_11111111111111111111111111111111"),
    (v) => (v.positions[0].snapshot = "psn_11111111111111111111111111111111"),
  ]) {
    const v = structuredClone(f.response);
    mutate(v);
    const c = new Bharosa({ ...config, fetch: async () => res(v) });
    await assert.rejects(invoke(c, f), InvalidResponseError);
  }
  const v = structuredClone(f.response);
  let total = 0n;
  for (const p of v.positions) {
    p.valuation.market_value.amount = "99999999999999999999.123456789012345678";
    total += 99999999999999999999123456789012345678n;
  }
  v.total_current_value.amount =
    total / 10n ** 18n +
    "." +
    (total % 10n ** 18n).toString().padStart(18, "0");
  const c = new Bharosa({ ...config, fetch: async () => res(v) });
  assert.equal(
    (await invoke(c, f)).total_current_value.amount,
    v.total_current_value.amount,
  );
});
test("server key modes remain guarded in browser and old Node", () => {
  const code = fs.readFileSync(
    new URL("../dist/index.cjs", import.meta.url),
    "utf8",
  );
  assert.throws(
    () =>
      vm.runInNewContext(code, { process: { versions: { node: "20.0.0" } } }),
    /requires/,
  );
  globalThis.window = { location: { origin: "https://api.example" } };
  try {
    assert.throws(() => new Bharosa(config), /requires server-side/);
  } finally {
    delete globalThis.window;
  }
});
test("reference results must exactly partition requested identifiers", async () => {
  const f = fixtures.find((f) => f.operation_id === "fund_references");
  const value = structuredClone(f.response);
  value.missing.push(value.data[0].instrument.id);
  const c = new Bharosa({ ...config, fetch: async () => res(value) });
  await assert.rejects(
    c.mutualFunds.references({ instruments: [value.data[0].instrument.id] }),
    InvalidResponseError,
  );
});
test("foreign resource ID is rejected", async () => {
  const f = fixtures.find((f) => f.operation_id === "retrieve_investor");
  const c = new Bharosa({
    ...config,
    fetch: async () =>
      res({ ...f.response, id: "inv_11111111111111111111111111111111" }),
  });
  await assert.rejects(invoke(c, f), InvalidResponseError);
});
test("future additive fields do not become validation authority", async () => {
  const c = new Bharosa({
    ...config,
    fetch: async () =>
      res({
        ...fixtures[0].response,
        future: {
          account: "opaque unrelated metadata",
          snapshot: "opaque",
          positions: [],
        },
      }),
  });
  await c.accounts.retrieve();
});
test("503 followed by rejection preserves uncertain mutation outcome", async () => {
  let n = 0;
  const f = fixtures.find((f) => f.operation_id === "create_investor");
  const c = new Bharosa({
    ...config,
    fetch: async () => failure(++n === 1 ? 503 : 401),
  });
  await assert.rejects(
    invoke(c, f, { maxRetries: 1 }),
    (e) => e instanceof APIError && e.outcome === "unknown",
  );
});
test("bounded retry count and default zero retries", async () => {
  let n = 0;
  const c = new Bharosa({
    ...config,
    fetch: async () => {
      n++;
      throw Error("network");
    },
  });
  await assert.rejects(c.accounts.retrieve(), TransportError);
  assert.equal(n, 1);
  n = 0;
  await assert.rejects(c.accounts.retrieve({ maxRetries: 2 }), TransportError);
  assert.equal(n, 3);
});
test("cancel during backoff", async () => {
  const ac = new AbortController();
  const c = new Bharosa({
    ...config,
    fetch: async () => {
      setTimeout(() => ac.abort(), 5);
      return failure(429, "limited", { "Retry-After": "20" });
    },
  });
  await assert.rejects(
    c.accounts.retrieve({ signal: ac.signal, maxRetries: 2 }),
    AbortError,
  );
});
test("zero and empty snapshots accepted; invalid dates and duplicates rejected", async () => {
  const f = fixtures.find((f) => f.operation_id === "replace_snapshot");
  const value = structuredClone(f.response);
  value.positions = [];
  value.instruments = [];
  value.snapshot.position_count = 0;
  value.total_current_value.amount = "0";
  const c = new Bharosa({ ...config, fetch: async () => res(value, 201) });
  const body = { ...f.request, positions: [] };
  assert.equal(
    (
      await c.portfolios.snapshots.create(value.portfolio.id, body, {
        idempotencyKey: "zero",
      })
    ).positions.length,
    0,
  );
  for (const as_of of ["1899-12-31", "2026-02-30", "9999-01-01"])
    await assert.rejects(
      c.portfolios.snapshots.create(
        value.portfolio.id,
        { ...body, as_of },
        { idempotencyKey: "bad" },
      ),
      ValidationError,
    );
  const dup = {
    ...f.request,
    positions: [f.request.positions[0], f.request.positions[0]],
  };
  await assert.rejects(
    c.portfolios.snapshots.create(value.portfolio.id, dup, {
      idempotencyKey: "dup",
    }),
    ValidationError,
  );
});
test("simultaneous separate accounts never share credential context", async () => {
  const accounts = [
    "acct_11111111111111111111111111111111",
    "acct_22222222222222222222222222222222",
  ];
  const clients = accounts.map(
    (account, i) =>
      new Bharosa({
        ...config,
        account,
        auth: { type: "account_key", apiKey: `synthetic-key-${i}` },
        fetch: async (url, init) => {
          await new Promise((r) => setTimeout(r, i === 0 ? 5 : 1));
          assert.ok(url.endsWith(account));
          assert.equal(init.headers.Authorization, `Bearer synthetic-key-${i}`);
          return res({ ...fixtures[0].response, id: account });
        },
      }),
  );
  const results = await Promise.all(clients.map((c) => c.accounts.retrieve()));
  assert.deepEqual(
    results.map((r) => r.id),
    accounts,
  );
});
for (const status of [502, 503, 504])
  for (const contentType of ["text/html", "text/plain"]) {
    test(`non-JSON ${status} ${contentType} honors status retries`, async () => {
      let calls = 0;
      const c = new Bharosa({
        ...config,
        fetch: async () => {
          calls++;
          return new Response("synthetic upstream failure", {
            status,
            headers: { "Content-Type": contentType, "Retry-After": "0" },
          });
        },
      });
      await assert.rejects(
        c.accounts.retrieve({ maxRetries: 2 }),
        (e) =>
          e instanceof InvalidResponseError &&
          e.status === status &&
          e.requestId === undefined &&
          e.code === undefined &&
          e.type === undefined,
      );
      assert.equal(calls, 3);
    });
  }
for (const contentType of ["application/json", "text/plain"])
  test(`429 without envelope retries ${contentType}`, async () => {
    let calls = 0;
    const c = new Bharosa({
      ...config,
      fetch: async () =>
        ++calls === 1
          ? new Response("{}", {
              status: 429,
              headers: { "Content-Type": contentType, "Retry-After": "0" },
            })
          : res(fixtures[0].response),
    });
    assert.deepEqual(
      await c.accounts.retrieve({ maxRetries: 1 }),
      fixtures[0].response,
    );
    assert.equal(calls, 2);
  });
test("unsupported open response streams cancel on rejection and before retries", async () => {
  for (const maxRetries of [0, 2]) {
    let calls = 0,
      cancelled = 0;
    const c = new Bharosa({
      ...config,
      fetch: async () => {
        assert.equal(
          cancelled,
          calls,
          "prior stream must be cancelled before next dispatch",
        );
        calls++;
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode("<html>"));
            },
            cancel() {
              cancelled++;
            },
          }),
          {
            status: 503,
            headers: { "Content-Type": "text/html", "Retry-After": "0" },
          },
        );
      },
    });
    await assert.rejects(
      c.accounts.retrieve({ maxRetries }),
      InvalidResponseError,
    );
    assert.equal(calls, maxRetries + 1);
    assert.equal(cancelled, calls);
  }
});
test("non-JSON retries preserve serialized mutation and idempotency key", async () => {
  const f = fixtures.find((f) => f.operation_id === "create_investor");
  const calls = [];
  const c = new Bharosa({
    ...config,
    fetch: async (url, init) => {
      calls.push(init);
      return calls.length < 3
        ? new Response("upstream", {
            status: 502,
            headers: { "Content-Type": "text/plain" },
          })
        : res(f.response, 201);
    },
  });
  await invoke(c, f, { maxRetries: 2 });
  assert.equal(calls.length, 3);
  for (const init of calls) {
    assert.equal(init.body, calls[0].body);
    assert.equal(
      init.headers["Idempotency-Key"],
      calls[0].headers["Idempotency-Key"],
    );
  }
});
test("non-JSON nonretryable responses still close streams", async () => {
  for (const status of [200, 401, 500]) {
    let calls = 0,
      cancelled = false;
    const c = new Bharosa({
      ...config,
      fetch: async () => {
        calls++;
        return new Response(
          new ReadableStream({
            cancel() {
              cancelled = true;
            },
          }),
          { status, headers: { "Content-Type": "text/html" } },
        );
      },
    });
    await assert.rejects(
      c.accounts.retrieve({ maxRetries: 2 }),
      InvalidResponseError,
    );
    assert.equal(calls, 1);
    assert.equal(cancelled, true);
  }
});
test("non-JSON Retry-After remains inside total timeout budget", async () => {
  let calls = 0,
    cancelled = false;
  const c = new Bharosa({
    ...config,
    fetch: async () => {
      calls++;
      return new Response(
        new ReadableStream({
          cancel() {
            cancelled = true;
          },
        }),
        {
          status: 503,
          headers: { "Content-Type": "text/html", "Retry-After": "100" },
        },
      );
    },
  });
  await assert.rejects(
    c.accounts.retrieve({ maxRetries: 2, timeoutMs: 15 }),
    TimeoutError,
  );
  assert.equal(calls, 1);
  assert.equal(cancelled, true);
});

test("portfolio targets are immutable and methods preserve JSON response fields", async () => {
  const f = fixtures.find((f) => f.operation_id === "asset_mix"),
    seen = [];
  const c = new Bharosa({
    ...config,
    fetch: async (u, i) => {
      seen.push(JSON.parse(i.body));
      return res(f.response);
    },
  });
  const input = {
    valuationDate: f.request.portfolio.valuation_date,
    positions: structuredClone(f.request.portfolio.positions),
  };
  const p = c.portfolios.fromPositions(input);
  input.positions[0].current_value = "9";
  await p.assetMix({ asOf: f.request.as_of });
  assert.deepEqual(seen[0], f.request);
  assert.deepEqual(Object.keys(p), []);
});
test("fund convenience methods delegate to the same underlying portfolio", async () => {
  const f = fixtures.find((f) => f.operation_id === "asset_mix"),
    seen = [];
  const c = new Bharosa({
    ...config,
    fetch: async (u, i) => {
      seen.push(JSON.parse(i.body));
      return res(f.response);
    },
  });
  const fund = c.mutualFunds.fromId("201");
  await fund.assetMix();
  await fund.portfolio.assetMix();
  assert.deepEqual(seen, [
    { portfolio: { type: "mutual_fund", mutual_fund_id: "201" } },
    { portfolio: { type: "mutual_fund", mutual_fund_id: "201" } },
  ]);
  assert.throws(
    () => c.mutualFunds.fromId("9223372036854775808"),
    ValidationError,
  );
});
test("read-only mix retry does not require idempotency and retains the request", async () => {
  const f = fixtures.find((f) => f.operation_id === "asset_mix"),
    seen = [];
  const c = new Bharosa({
    ...config,
    fetch: async (u, i) => {
      seen.push(i.body);
      assert.equal(i.headers["Idempotency-Key"], undefined);
      if (seen.length === 1) return failure(503);
      return res(f.response);
    },
  });
  await c.mutualFunds.fromId("201").assetMix({}, { maxRetries: 1 });
  assert.equal(seen.length, 2);
  assert.equal(seen[0], seen[1]);
});
test("mix response account, portfolio, kind and requested date must match", async () => {
  const f = fixtures.find((f) => f.operation_id === "asset_mix");
  for (const patch of [
    { account: "acct_ffffffffffffffffffffffffffffffff" },
    { portfolio: "ptf_ffffffffffffffffffffffffffffffff" },
    { mix_type: "sector" },
    { as_of_date: "2026-10-17" },
  ]) {
    const c = new Bharosa({
      ...config,
      fetch: async () => res({ ...f.response, ...patch }),
    });
    await assert.rejects(
      c.mutualFunds.fromId("201").assetMix({ asOf: "2026-10-18" }),
      InvalidResponseError,
    );
  }
});
test("signed asset percentages survive transport while sector and issuer stay bounded", async () => {
  const f = fixtures.find((f) => f.operation_id === "asset_mix"),
    body = structuredClone(f.response);
  body.mix.items.find((i) => i.code === "equity").percentage = "111.1111111111";
  body.mix.items.find((i) => i.code === "cash").percentage = "-11.1111111111";
  const c = new Bharosa({ ...config, fetch: async () => res(body) });
  assert.deepEqual(
    (await c.mutualFunds.fromId("201").assetMix()).mix,
    body.mix,
  );
});

test("build aliases fromPositions and exposes defensively copied immutable positions", async () => {
  const fixture = fixtures.find((f) => f.operation_id === "asset_mix");
  const seen = [];
  const client = new Bharosa({
    ...config,
    fetch: async (_url, init) => {
      seen.push(JSON.parse(init.body));
      return res(fixture.response);
    },
  });
  assert.equal(client.portfolios.build, client.portfolios.fromPositions);
  const positions = structuredClone(fixture.request.portfolio.positions);
  const original = structuredClone(positions);
  const portfolio = client.portfolios.build({
    valuationDate: fixture.request.portfolio.valuation_date,
    positions,
  });
  assert.equal(seen.length, 0);
  assert.deepEqual(portfolio.positions, original);
  assert.notEqual(portfolio.positions, positions);
  assert.notEqual(portfolio.positions[0], positions[0]);
  assert.ok(Object.isFrozen(portfolio.positions));
  assert.ok(Object.isFrozen(portfolio.positions[0]));
  positions[0].current_value = "999";
  positions.push({ instrument: "ins_another", current_value: "2" });
  assert.throws(() => {
    portfolio.positions[0].current_value = "3";
  }, TypeError);
  assert.throws(() => portfolio.positions.push({}), TypeError);
  assert.throws(() => {
    portfolio.positions = [];
  }, TypeError);
  await portfolio.assetMix({ asOf: fixture.request.as_of });
  assert.deepEqual(seen, [fixture.request]);
  assert.equal(JSON.stringify(portfolio), "{}");
  assert.equal(portfolio.currentSnapshot, undefined);
});

test("build and fromPositions reject the same invalid inputs without dispatch", () => {
  let calls = 0;
  const client = new Bharosa({
    ...config,
    fetch: async () => {
      calls++;
      throw Error("unexpected");
    },
  });
  for (const input of [
    null,
    {},
    { valuationDate: "not-a-date", positions: [] },
    { valuationDate: "2026-10-18", currency: "USD", positions: [] },
    {
      valuationDate: "2026-10-18",
      positions: [{ instrument: "ins_example", current_value: 1 }],
    },
  ])
    for (const build of [
      client.portfolios.build,
      client.portfolios.fromPositions,
    ])
      assert.throws(() => build(input), ValidationError);
  assert.equal(calls, 0);
});

test("all saved portfolio entry points expose currentSnapshot without changing JSON", async () => {
  const current = fixtures.find((f) => f.operation_id === "current_snapshot");
  for (const id of [
    "retrieve_portfolio",
    "list_portfolios",
    "create_portfolio",
    "current_snapshot",
    "replace_snapshot",
  ]) {
    const fixture = fixtures.find((f) => f.operation_id === id);
    const calls = [];
    const client = new Bharosa({
      ...config,
      fetch: async (url, init) => {
        calls.push({ url, init });
        return res(
          calls.length === 1 ? fixture.response : current.response,
          calls.length === 1 ? fixture.status : current.status,
        );
      },
    });
    const response = await invoke(client, fixture);
    const portfolio =
      response.object === "list"
        ? response.data[0]
        : (response.portfolio ?? response);
    const json = JSON.stringify(response);
    assert.equal(typeof portfolio.currentSnapshot, "function");
    assert.equal(
      Object.prototype.propertyIsEnumerable.call(portfolio, "currentSnapshot"),
      false,
    );
    const snapshot = await portfolio.currentSnapshot({ timeoutMs: 1000 });
    assert.deepEqual(snapshot, current.response);
    assert.equal(typeof snapshot.portfolio.currentSnapshot, "function");
    assert.equal(JSON.stringify(response), json);
    assert.equal(
      calls[1].url,
      `${config.baseUrl}/v1/accounts/${account}/portfolios/${portfolio.id}/current_snapshot`,
    );
    assert.equal(calls[1].init.method, "GET");
    assert.equal(calls[1].init.body, undefined);
    assert.equal(
      calls[1].init.headers.Authorization,
      "Bearer synthetic-secret-only",
    );
  }
});

test("currentSnapshot preserves delegated auth, original resource identity and cancellation", async () => {
  const portfolioFixture = fixtures.find(
    (f) => f.operation_id === "retrieve_portfolio",
  );
  const current = fixtures.find((f) => f.operation_id === "current_snapshot");
  const calls = [];
  const client = new Bharosa({
    ...config,
    auth: {
      type: "delegated_application",
      apiKey: "synthetic-app",
      userAccessToken: "synthetic-user",
    },
    fetch: async (url, init) => {
      calls.push({ url, init });
      return res(
        calls.length === 1 ? portfolioFixture.response : current.response,
      );
    },
  });
  const portfolio = await client.portfolios.retrieve(
    portfolioFixture.response.id,
  );
  portfolio.id = "ptf_ffffffffffffffffffffffffffffffff";
  await portfolio.currentSnapshot();
  assert.ok(calls[1].url.includes(portfolioFixture.response.id));
  assert.equal(calls[1].init.headers.Authorization, "Bearer synthetic-app");
  assert.equal(
    calls[1].init.headers["Bharosa-User-Authorization"],
    "Bearer synthetic-user",
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    portfolio.currentSnapshot({ signal: controller.signal }),
    AbortError,
  );
  assert.equal(calls.length, 2);
});

test("human error messages give next steps without changing structured metadata", () => {
  const meta = {
    code: "synthetic_code",
    requestId: "req_example",
    outcome: "unknown",
    status: 503,
  };
  for (const Type of [
    APIError,
    TransportError,
    TimeoutError,
    AbortError,
    InvalidResponseError,
  ]) {
    const error = new Type(meta);
    assert.equal(error.code, meta.code);
    assert.equal(error.requestId, meta.requestId);
    assert.equal(error.outcome, "unknown");
    assert.match(error.message, /check|Check|Contact|contact/);
    assert.ok(!error.message.includes(meta.code));
  }
  assert.match(new ValidationError().message, /not sent/);
});

test("saved portfolio current view sends separate typed operations and validates evidence", async () => {
  const portfolio = fixtures.find(
    (f) => f.operation_id === "retrieve_portfolio",
  ).response;
  const seen = [];
  let corrupt = false;
  const client = new Bharosa({
    baseUrl: "https://synthetic.invalid",
    account,
    transport: {
      send: async (url, init) => {
        seen.push(new URL(url).pathname);
        if (init.method === "GET") return res(portfolio);
        const kind = new URL(url).pathname.match(
          /current_(asset|sector|issuer)_mix$/,
        )?.[1];
        assert.ok(kind);
        assert.deepEqual(JSON.parse(init.body), {
          portfolio: { type: "saved", id: portfolio.id },
        });
        const data = structuredClone(
          fixtures.find((f) => f.operation_id === kind + "_mix").response,
        );
        data.portfolio = portfolio.id;
        data.valuation_date = "2026-10-18";
        data.current_valuation = {
          valuation_date: "2026-10-18",
          holdings: [
            {
              holding: "hld_synthetic",
              investment_account: "iac_synthetic",
              instrument: "ins_synthetic",
              scheme_id: "101",
              status: "available",
              units: "1.25",
              as_of: "2026-10-18",
              position_date: "2026-10-16",
              value: { amount: "154.320875", currency: "INR" },
              nav: {
                amount: "123.4567",
                currency: "INR",
                date: corrupt ? "2026-10-19" : "2026-10-16",
              },
              freshness: {
                status: "recent",
                age_days: 2,
                recent_within_days: 3,
                time_zone: "Asia/Kolkata",
              },
              ownership_status: "user_supplied_not_verified",
              valuation_basis: "units_times_latest_nav",
              revision: 2,
              source: { kind: "user", reference: "synthetic" },
              derivation: { kind: "supplied" },
            },
          ],
        };
        return res(data);
      },
    },
  });
  const saved = await client.portfolios.retrieve(portfolio.id);
  assert.equal(typeof saved.current, "function");
  for (const kind of ["asset", "sector", "issuer"]) {
    const result = await saved.current()[kind + "Mix"]();
    assert.equal(
      result.current_valuation.holdings[0].value.amount,
      "154.320875",
    );
  }
  assert.equal(seen.length, 4);
  assert.throws(
    () => saved.current().assetMix({ asOf: "2026-10-18" }),
    ValidationError,
  );
  corrupt = true;
  await assert.rejects(saved.current().assetMix(), InvalidResponseError);
});
