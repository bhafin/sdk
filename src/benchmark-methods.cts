import type * as B from "./benchmark-types.cjs";
import type { createTransport } from "./transport.cjs";
import { check, keys } from "./transport.cjs";
type Call = ReturnType<typeof createTransport>;

function selection(q: B.BenchmarkSelection, index = false) {
  keys(q, index ? ["asOf", "periods", "subIndexId"] : ["asOf", "periods"]);
  if (q.periods !== undefined)
    check(
      Array.isArray(q.periods) &&
        q.periods.length >= 1 &&
        q.periods.length <= 3 &&
        new Set(q.periods).size === q.periods.length &&
        q.periods.every((p) => ["1y", "3y", "5y"].includes(p)),
    );
  return {
    as_of: q.asOf,
    ...(q.periods === undefined ? {} : { periods: q.periods.join(",") }),
    ...(index && (q as B.IndexPerformanceSelection).subIndexId !== undefined
      ? { sub_index_id: (q as B.IndexPerformanceSelection).subIndexId }
      : {}),
  };
}
export function benchmarkMethods(
  call: Call,
  owner: "fund" | "scheme",
): B.BenchmarkClient {
  return Object.freeze<B.BenchmarkClient>({
    retrieve: (id, options) =>
      call(
        owner === "fund" ? "benchmark_fund" : "benchmark_scheme",
        { id },
        undefined,
        options,
      ),
    performance: Object.freeze<B.BenchmarkClient["performance"]>({
      retrieve: (id, q, options) =>
        call(
          owner === "fund"
            ? "benchmark_fund_performance"
            : "benchmark_scheme_performance",
          { id, ...selection(q) },
          undefined,
          options,
        ),
    }),
  });
}
export function indexMethods(call: Call): B.IndexClient {
  return Object.freeze<B.IndexClient>({
    list: (q = {}, options) => {
      keys(q, ["query", "limit", "startingAfter"]);
      return call(
        "benchmark_indexes",
        {
          ...(q.query === undefined ? {} : { query: q.query }),
          ...(q.limit === undefined ? {} : { limit: q.limit }),
          ...(q.startingAfter === undefined
            ? {}
            : { starting_after: q.startingAfter }),
        },
        undefined,
        options,
      );
    },
    retrieve: (id, options) =>
      call("benchmark_index", { id }, undefined, options),
    performance: Object.freeze<B.IndexClient["performance"]>({
      retrieve: (id, q, options) =>
        call(
          "benchmark_index_performance",
          { id, ...selection(q, true) },
          undefined,
          options,
        ),
    }),
  });
}
