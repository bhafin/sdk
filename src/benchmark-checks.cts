import { record } from "./schema.cjs";
function field(value: unknown, ...path: string[]): unknown {
  for (const key of path) {
    if (!record(value)) return undefined;
    value = value[key];
  }
  return value;
}
function rows(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function start(end: string, period: string): string {
  const d = new Date(end + "T00:00:00Z"),
    month = d.getUTCMonth();
  d.setUTCFullYear(d.getUTCFullYear() - Number(period[0]));
  if (d.getUTCMonth() !== month) d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}
export function benchmarkMatches(
  id: string,
  data: unknown,
  params: Record<string, unknown>,
): boolean {
  const d = (...path: string[]) => field(data, ...path);
  if (id === "benchmark_indexes") {
    const list = rows(d("data"));
    const ids = list.map((x) => BigInt(String(field(x, "id"))));
    return (
      list.length <= Number(params.limit ?? 20) &&
      !(d("has_more") && !list.length) &&
      ids.every(
        (v, i) =>
          v > (i ? ids[i - 1] : BigInt(String(params.starting_after ?? "0"))),
      )
    );
  }
  if (id === "benchmark_index") return d("id") === params.id;
  const index = id === "benchmark_index_performance";
  const scheme = id.startsWith("benchmark_scheme");
  if (d(index ? "index_id" : scheme ? "scheme_id" : "fund_id") !== params.id)
    return false;
  if (!id.endsWith("_performance")) return true;
  if (
    d("requested_as_of") !== params.as_of ||
    d("source_cutoff") !== params.as_of
  )
    return false;
  if (
    index &&
    params.sub_index_id !== undefined &&
    d("sub_index_id") !== params.sub_index_id
  )
    return false;
  const expected = String(params.periods ?? "1y,3y,5y").split(",");
  const results = rows(d("periods"));
  if (results.length !== expected.length) return false;
  return results.every((p, i) => {
    const from = start(String(params.as_of), expected[i]);
    if (
      field(p, "period") !== expected[i] ||
      field(p, "requested_start") !== from ||
      field(p, "requested_end") !== params.as_of ||
      field(p, "status") !== field(p, "total_return_pct", "status") ||
      field(p, "reason") !== field(p, "total_return_pct", "reason")
    )
      return false;
    const components = rows(field(p, "components"));
    const mappings = rows(d("components"));
    if (
      components.length !==
      (index ? (d("sub_index_id") === null ? 0 : 1) : mappings.length)
    )
      return false;
    return components.every((c, j) => {
      if (
        field(c, "sub_index_id") !==
          (index ? d("sub_index_id") : field(mappings[j], "sub_index_id")) ||
        field(c, "weight_pct") !==
          (index ? "100" : field(mappings[j], "weight_pct"))
      )
        return false;
      const begin = field(c, "start_observation_date"),
        end = field(c, "end_observation_date");
      return (
        !(typeof begin === "string" && begin > from) &&
        !(typeof end === "string" && end > String(params.as_of))
      );
    });
  });
}
