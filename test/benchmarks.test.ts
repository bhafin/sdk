import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Bharosa,
  BharosaMarket,
  InvalidResponseError,
  ValidationError,
} from "../dist/index.mjs";
import { createTransport } from "../dist/transport.cjs";
const index = {
  object: "index",
  id: "7",
  name: "Synthetic Index",
  variants: [
    { id: "71", type: "tri" },
    { id: "72", type: "adj_tri" },
  ],
  default_sub_index_id: "71",
};
const component = {
  id: "1",
  index_id: "7",
  index_name: "Synthetic Index",
  sub_index_id: "72",
  variant: "adj_tri",
  benchmark_type: "assigned",
  weight_pct: "60",
};
const composition = {
  object: "fund_benchmark",
  fund_id: "9",
  mapping_basis: "current_stored",
  components: [component],
};
const available = (value: string) => ({
  status: "available",
  value,
  reason: null,
});
const missing = (reason: string) => ({
  status: "unavailable",
  value: null,
  reason,
});
function performance(
  owner = "fund",
  subIndexId = "71",
  periods = ["1y", "3y", "5y"],
) {
  const isIndex = owner === "index";
  return {
    object: isIndex ? "index_performance" : "fund_benchmark_performance",
    ...(isIndex
      ? { index_id: "7", sub_index_id: subIndexId }
      : { fund_id: "9", ...(owner === "scheme" ? { scheme_id: "11" } : {}) }),
    currency: "INR",
    requested_as_of: "2026-10-01",
    source_cutoff: "2026-10-01",
    source_version: "synthetic",
    methodology_version: "stored_weighted_component_returns_v1",
    basis: "stored_quotes",
    mapping_basis: "current_stored",
    weighting: "stored_percentage_weights_without_normalization",
    calculation_precision: "decimal_inputs_float64_returns",
    freshness_policy: { quote_days: 45 },
    components: isIndex ? [] : [component],
    warnings: [],
    periods: periods.map((p) => ({
      period: p,
      requested_start: `${2026 - Number(p[0])}-10-01`,
      requested_end: "2026-10-01",
      status: "available",
      reason: null,
      total_return_pct: available(isIndex ? "10" : "6"),
      cagr_pct: missing("period_not_longer_than_one_year"),
      annualization_basis: "observed_quote_dates_365_25",
      components: [
        {
          sub_index_id: isIndex ? subIndexId : "72",
          weight_pct: isIndex ? "100" : "60",
          start_observation_date: `${2026 - Number(p[0])}-10-01`,
          end_observation_date: "2026-10-01",
          start_quote: "100",
          end_quote: "110",
          currency: "INR",
          start_lag_days: 0,
          end_lag_days: 0,
          elapsed_days: 365 * Number(p[0]),
          status: "available",
          reason: null,
          total_return_pct: available("10"),
          cagr_pct: missing("period_not_longer_than_one_year"),
        },
      ],
    })),
  };
}
test("all index and fund/scheme benchmark methods use baseline canonical paths", async () => {
  const seen: string[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const u = new URL(String(input));
    seen.push(u.pathname);
    assert.equal(init?.method, "GET");
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer synthetic",
    );
    assert.equal(
      new Headers(init?.headers).get("Bharosa-User-Authorization"),
      null,
    );
    if (u.pathname.endsWith("/indexes")) {
      assert.equal(u.searchParams.get("starting_after"), "6");
      assert.equal(u.searchParams.get("query"), "Synthetic");
      return Response.json({
        object: "list",
        data: [index],
        has_more: false,
        url: "/v1/market-data/indexes",
      });
    }
    if (u.pathname.endsWith("/indexes/7")) return Response.json(index);
    const owner = u.pathname.includes("indexes")
      ? "index"
      : u.pathname.includes("schemes")
        ? "scheme"
        : "fund";
    if (u.pathname.endsWith("/performance")) {
      assert.equal(u.searchParams.get("as_of"), "2026-10-01");
      return Response.json(
        performance(
          owner,
          u.searchParams.get("sub_index_id") ?? "71",
          (u.searchParams.get("periods") ?? "1y,3y,5y").split(","),
        ),
      );
    }
    return Response.json({
      ...composition,
      ...(owner === "scheme" ? { scheme_id: "11" } : {}),
    });
  };
  const clients = [
    new Bharosa({ apiKey: "synthetic", fetch: fetcher }).markets,
    new BharosaMarket({ apiKey: "synthetic", fetch: fetcher }),
  ];
  for (const client of clients) {
    assert.equal(
      (
        await client.indexes.list({
          query: "Synthetic",
          limit: 5,
          startingAfter: "6",
        })
      ).data[0].id,
      "7",
    );
    assert.equal(
      (await client.indexes.retrieve("7")).default_sub_index_id,
      "71",
    );
    assert.equal(
      (
        await client.indexes.performance.retrieve("7", {
          asOf: "2026-10-01",
          subIndexId: "72",
          periods: ["3y"],
        })
      ).sub_index_id,
      "72",
    );
    assert.equal(
      (await client.funds.benchmark.retrieve("9")).components[0].weight_pct,
      "60",
    );
    assert.equal(
      (
        await client.funds.benchmark.performance.retrieve("9", {
          asOf: "2026-10-01",
        })
      ).periods.length,
      3,
    );
    assert.equal((await client.schemes.benchmark.retrieve("11")).fund_id, "9");
    assert.equal(
      (
        await client.schemes.benchmark.performance.retrieve("11", {
          asOf: "2026-10-01",
        })
      ).fund_id,
      "9",
    );
  }
  assert.deepEqual(seen.slice(0, 7), [
    "/v1/market-data/indexes",
    "/v1/market-data/indexes/7",
    "/v1/market-data/indexes/7/performance",
    "/v1/market-data/funds/9/benchmark",
    "/v1/market-data/funds/9/benchmark/performance",
    "/v1/market-data/schemes/11/benchmark",
    "/v1/market-data/schemes/11/benchmark/performance",
  ]);
});
test("unavailable history and empty benchmark stay explicit", async () => {
  const source = performance();
  const result = {
    ...source,
    components: [],
    periods: source.periods.map((p) => ({
      ...p,
      components: [],
      status: "unavailable",
      reason: "benchmark_not_configured",
      total_return_pct: missing("benchmark_not_configured"),
      cagr_pct: missing("benchmark_not_configured"),
    })),
  };
  const client = new BharosaMarket({
    apiKey: "synthetic",
    fetch: async () => Response.json(result),
  });
  const response = await client.funds.benchmark.performance.retrieve("9", {
    asOf: "2026-10-01",
  });
  assert.equal(response.periods[2].total_return_pct.value, null);
  assert.equal(response.periods[0].reason, "benchmark_not_configured");
});
test("invalid parameters reject before transport and private allowlist remains fenced", async () => {
  let sent = 0;
  const config = {
    apiKey: "synthetic",
    fetch: async () => {
      sent++;
      throw Error("must not send");
    },
  };
  const client = new BharosaMarket(config);
  for (const q of [
    { asOf: "2026-10-01", periods: ["1y", "1y"] },
    { asOf: "2026-10-01", periods: ["since_inception"] },
    { asOf: "2026-10-01", account: "me" },
  ])
    assert.throws(
      () => client.funds.benchmark.performance.retrieve("9", q as never),
      ValidationError,
    );
  for (const q of [
    { asOf: "2026-10-02" },
    { asOf: "2026-02-30" },
    { asOf: "2026-10-01", subIndexId: "bad" },
  ])
    await assert.rejects(
      client.indexes.performance.retrieve("7", q),
      ValidationError,
    );
  await assert.rejects(client.indexes.list({ limit: 101 }), ValidationError);
  await assert.rejects(client.indexes.retrieve("bad"), ValidationError);
  await assert.rejects(createTransport(config, true)("retrieve_account"), {
    code: "market_only_operation",
  });
  assert.equal(sent, 0);
});
test("responses cannot swap fund/scheme/index, selected variant, periods or observation boundaries", async () => {
  const source = performance("scheme");
  const bad = [
    { ...source, scheme_id: "12" },
    { ...source, fund_id: null },
    { ...source, requested_as_of: "2026-09-01" },
    { ...source, periods: source.periods.slice(0, 1) },
    {
      ...source,
      periods: source.periods.map((p) => ({
        ...p,
        components: p.components.map((c) => ({
          ...c,
          end_observation_date: "2026-10-02",
        })),
      })),
    },
  ];
  for (const response of bad) {
    const client = new BharosaMarket({
      apiKey: "synthetic",
      fetch: async () => Response.json(response),
    });
    await assert.rejects(
      client.schemes.benchmark.performance.retrieve("11", {
        asOf: "2026-10-01",
      }),
      InvalidResponseError,
    );
  }
  const client = new BharosaMarket({
    apiKey: "synthetic",
    fetch: async () => Response.json(performance("index", "71")),
  });
  await assert.rejects(
    client.indexes.performance.retrieve("7", {
      asOf: "2026-10-01",
      subIndexId: "72",
    }),
    InvalidResponseError,
  );
});
test("baseline benchmark errors and cancellation preserve transport behavior", async () => {
  for (const status of [401, 403, 404, 429, 503]) {
    const client = new BharosaMarket({
      apiKey: "synthetic",
      fetch: async () =>
        Response.json(
          { error: { code: "synthetic_denial", message: "denied" } },
          { status },
        ),
    });
    await assert.rejects(client.funds.benchmark.retrieve("9"), { status });
  }
  const controller = new AbortController();
  controller.abort();
  const client = new BharosaMarket({
    apiKey: "synthetic",
    fetch: async () => {
      throw Error("must not send");
    },
  });
  await assert.rejects(client.indexes.list({}, { signal: controller.signal }));
});
