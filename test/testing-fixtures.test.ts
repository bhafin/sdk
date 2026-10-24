import assert from "node:assert/strict";
import { test } from "node:test";
import {
  sampleFunds,
  samplePortfolios,
  seedSamplePortfolio,
  SampleSeedError,
  type SeedOptions,
  type SeedClient,
} from "../dist/testing.cjs";
import type { Bharosa } from "../dist/index.mjs";
function acceptsRealSdk(client: Bharosa): SeedClient {
  return client;
}
void acceptsRealSdk;
test("offline scenarios are deterministic fresh copies with synthetic symbols, never live IDs", async () => {
  const a = samplePortfolios(),
    b = samplePortfolios();
  assert.deepEqual(a, b);
  assert.deepEqual(
    a.map((p: { id: string }) => p.id),
    ["equity-heavy", "mixed-allocation", "overlapping-funds", "new-investor"],
  );
  a[0].positions[0].amount = "1";
  assert.equal(b[0].positions[0].amount, "80000");
  assert.ok(
    b.every((p: { positions: { symbol: string }[] }) =>
      p.positions.every((x) => x.symbol.startsWith("synthetic:")),
    ),
  );
  assert.equal(b[3].positions.length, 0);
});
test("seeding is explicit, account checked, idempotent and does not seed an empty portfolio", async () => {
  const calls: { key: string; body: unknown }[] = [];
  const client = {
    accounts: {
      async retrieve() {
        return { id: "acct_test" };
      },
    },
    investors: {
      async create(body: unknown, o: { idempotencyKey: string }) {
        calls.push({ key: o.idempotencyKey, body });
        return { id: "inv_test" };
      },
    },
    portfolios: {
      async create(body: unknown, o: { idempotencyKey: string }) {
        calls.push({ key: o.idempotencyKey, body });
        return { portfolio: { id: "ptf_test" } };
      },
    },
  };
  const options: SeedOptions = {
    confirmTestAccount: "acct_test",
    runId: "workshop-1",
    scenario: "equity-heavy",
    instruments: {
      "synthetic:equity-a": "ins_resolved_a",
      "synthetic:debt": "ins_resolved_b",
    },
  };
  await seedSamplePortfolio(client, options);
  await seedSamplePortfolio(client, options);
  assert.deepEqual(calls.slice(0, 2), calls.slice(2));
  assert.equal(calls.length, 4);
  await assert.rejects(
    seedSamplePortfolio(client, {
      ...options,
      confirmTestAccount: "acct_other",
    }),
    /account/i,
  );
  await assert.rejects(
    seedSamplePortfolio(client, { ...options, instruments: {} }),
    /instrument/i,
  );
  assert.equal(calls.length, 4);
  await seedSamplePortfolio(client, {
    ...options,
    scenario: "new-investor",
    instruments: {},
  });
  assert.equal(calls.length, 5);
});

test("partial failure exposes resumable phase without rollback or duplicate keys", async () => {
  const keys: string[] = [];
  let fail = true;
  const client: SeedClient = {
    accounts: {
      async retrieve() {
        return { id: "acct_test" };
      },
    },
    investors: {
      async create(_b, o) {
        keys.push(o.idempotencyKey);
        return { id: "inv_test" };
      },
    },
    portfolios: {
      async create(_b, o) {
        keys.push(o.idempotencyKey);
        if (fail) throw new Error("synthetic response lost");
        return { portfolio: { id: "ptf_test" } };
      },
    },
  };
  const options: SeedOptions = {
    confirmTestAccount: "acct_test",
    runId: "retry",
    scenario: "equity-heavy",
    instruments: {
      "synthetic:equity-a": "ins_resolved_a",
      "synthetic:debt": "ins_resolved_b",
    },
  };
  await assert.rejects(
    seedSamplePortfolio(client, options),
    (e) =>
      e instanceof SampleSeedError &&
      e.phase === "portfolio" &&
      e.investor === "inv_test",
  );
  fail = false;
  await seedSamplePortfolio(client, options);
  assert.deepEqual(keys.slice(0, 2), keys.slice(2));
});

test("fictional overlapping funds share one asset and are independently allocated", () => {
  const a = sampleFunds(),
    b = sampleFunds();
  assert.equal(a[0].holdings[0].asset, a[1].holdings[0].asset);
  assert.equal(a[0].holdings[0].weight, "0.6");
  a[0].holdings[0].weight = "0";
  assert.equal(b[0].holdings[0].weight, "0.6");
});

const seedOptions: SeedOptions = {
  confirmTestAccount: "acct_test",
  runId: "ledger",
  scenario: "equity-heavy",
  instruments: { "synthetic:equity-a": "ins_a", "synthetic:debt": "ins_b" },
};
// Synthetic persistence boundary: commit once, then optionally lose the response.
function ledger(loss?: "investor" | "portfolio") {
  const entries = new Map<string, { body: string; id: string; kind: string }>();
  let calls = 0,
    lost = false;
  function persist(kind: "investor" | "portfolio", body: unknown, key: string) {
    calls++;
    const serialized = JSON.stringify(body),
      previous = entries.get(key);
    if (previous) {
      if (previous.body !== serialized)
        throw new Error("idempotency_key_reused");
      return previous.id;
    }
    const id = kind + "_" + (entries.size + 1);
    entries.set(key, { body: serialized, id, kind });
    if (kind === loss && !lost) {
      lost = true;
      throw new Error("response lost after persistence");
    }
    return id;
  }
  const client: SeedClient = {
    accounts: {
      async retrieve() {
        calls++;
        return { id: "acct_test" };
      },
    },
    investors: {
      async create(b, o) {
        return { id: persist("investor", b, o.idempotencyKey) };
      },
    },
    portfolios: {
      async create(b, o) {
        return { portfolio: { id: persist("portfolio", b, o.idempotencyKey) } };
      },
    },
  };
  return { client, entries, calls: () => calls };
}
for (const value of [undefined, null, 123])
  test(`runId ${String(value)} rejects before every client call`, async () => {
    const l = ledger();
    // Deliberately exercise untyped JavaScript callers without weakening production types.
    await assert.rejects(
      Reflect.apply(seedSamplePortfolio, undefined, [
        l.client,
        { ...seedOptions, runId: value },
      ]),
      /runId/,
    );
    assert.equal(l.calls(), 0);
    assert.equal(l.entries.size, 0);
  });
test("overlong instrument suffix rejects before every client call; 150 characters succeeds", async () => {
  const l = ledger();
  await assert.rejects(
    seedSamplePortfolio(l.client, {
      ...seedOptions,
      instruments: {
        ...seedOptions.instruments,
        "synthetic:equity-a": "ins_" + "a".repeat(151),
      },
    }),
    /instrument/,
  );
  assert.equal(l.calls(), 0);
  await seedSamplePortfolio(l.client, {
    ...seedOptions,
    instruments: {
      ...seedOptions.instruments,
      "synthetic:equity-a": "ins_" + "a".repeat(150),
    },
  });
  assert.equal(l.entries.size, 2);
});
for (const phase of ["investor", "portfolio"] as const)
  test(`${phase} persisted before lost response replays without duplicate rows`, async () => {
    const l = ledger(phase);
    await assert.rejects(
      seedSamplePortfolio(l.client, seedOptions),
      (e) => e instanceof SampleSeedError && e.phase === phase,
    );
    assert.equal(l.entries.size, phase === "investor" ? 1 : 2);
    const saved = [...l.entries.entries()];
    const receipt = await seedSamplePortfolio(l.client, seedOptions);
    assert.equal(l.entries.size, 2);
    for (const [key, row] of saved) assert.deepEqual(l.entries.get(key), row);
    assert.equal(receipt.investor, "investor_1");
    assert.equal(receipt.portfolio, "portfolio_2");
    assert.deepEqual(await seedSamplePortfolio(l.client, seedOptions), receipt);
    assert.equal(l.entries.size, 2);
  });
test("changed mapping with same runId conflicts without modifying persisted rows", async () => {
  const l = ledger();
  await seedSamplePortfolio(l.client, seedOptions);
  const before = [...l.entries.entries()];
  await assert.rejects(
    seedSamplePortfolio(l.client, {
      ...seedOptions,
      instruments: {
        ...seedOptions.instruments,
        "synthetic:equity-a": "ins_changed",
      },
    }),
    (e) =>
      e instanceof SampleSeedError &&
      e.phase === "portfolio" &&
      e.cause instanceof Error &&
      e.cause.message === "idempotency_key_reused",
  );
  assert.deepEqual([...l.entries.entries()], before);
});
test("duplicate mapped instruments fail before account lookup or writes", async () => {
  const l = ledger();
  await assert.rejects(
    seedSamplePortfolio(l.client, {
      ...seedOptions,
      instruments: {
        "synthetic:equity-a": "ins_same",
        "synthetic:debt": "ins_same",
      },
    }),
    /distinct/,
  );
  assert.equal(l.calls(), 0);
  assert.equal(l.entries.size, 0);
});
