import { schemas } from "./contract.cjs";
import { record, type Schema } from "./schema.cjs";
export function valid(s: Schema | undefined, v: unknown, depth = 0): boolean {
  if (!s || depth > 64) return false;
  if (s.$ref)
    return valid(schemas[s.$ref.split("/").pop() ?? ""], v, depth + 1);
  if (s.anyOf) return s.anyOf.some((x) => valid(x, v, depth + 1));
  if ("const" in s && v !== s.const) return false;
  if (s.enum && !s.enum.includes(v)) return false;
  switch (s.type) {
    case "null":
      return v === null;
    case "boolean":
      return typeof v === "boolean";
    case "integer":
    case "number":
      return (
        typeof v === "number" &&
        Number.isFinite(v) &&
        (s.type !== "integer" || Number.isSafeInteger(v)) &&
        (s.minimum === undefined || v >= s.minimum) &&
        (s.maximum === undefined || v <= s.maximum)
      );
    case "string": {
      if (
        typeof v !== "string" ||
        (s.minLength !== undefined && [...v].length < s.minLength) ||
        (s.maxLength !== undefined && [...v].length > s.maxLength) ||
        (s.pattern && !new RegExp(s.pattern).test(v))
      )
        return false;
      if (s.format === "date") {
        const d = new Date(v + "T00:00:00Z");
        const today = new Date(Date.now() + 19800000)
          .toISOString()
          .slice(0, 10);
        return (
          Number.isFinite(d.getTime()) &&
          d.toISOString().slice(0, 10) === v &&
          v >= "1900-01-01" &&
          v <= today
        );
      }
      if (s.format === "date-time")
        return (
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
            v,
          ) && Number.isFinite(Date.parse(v))
        );
      return true;
    }
    case "array":
      return (
        Array.isArray(v) &&
        (s.minItems === undefined || v.length >= s.minItems) &&
        (s.maxItems === undefined || v.length <= s.maxItems) &&
        (!s.uniqueItems ||
          new Set(v.map((x) => JSON.stringify(x))).size === v.length) &&
        v.every((x) => valid(s.items, x, depth + 1))
      );
    case "object": {
      if (!record(v)) return false;
      const keys = Object.keys(v);
      return (
        (s.minProperties === undefined || keys.length >= s.minProperties) &&
        (s.required ?? []).every((k) => Object.hasOwn(v, k)) &&
        keys.every((k) =>
          Object.hasOwn(s.properties ?? {}, k)
            ? valid(s.properties?.[k], v[k], depth + 1)
            : s.additionalProperties !== false,
        )
      );
    }
    default:
      return true;
  }
}
function decimal(value: unknown): bigint | undefined {
  if (typeof value !== "string" || !/^[0-9]+(?:\.[0-9]{1,18})?$/.test(value))
    return undefined;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0"));
}
/** Consistency supplements shape validation; it never trusts unvalidated JSON. */
export function consistent(value: unknown, account: string): boolean {
  if (!record(value)) return true;
  const v = value;
  if (
    typeof v.object === "string" &&
    [
      "client",
      "investor",
      "portfolio",
      "portfolio_mix",
      "holding",
      "holding_position",
      "history_import",
      "portfolio_history",
      "investment_account",
      "position_snapshot",
      "position",
    ].includes(v.object) &&
    account !== "me" &&
    v.account !== account
  )
    return false;
  if (v.object === "account" && account !== "me" && v.id !== account)
    return false;
  if (v.snapshot && v.positions) {
    const s = v.snapshot,
      i = v.investment_account,
      p = v.portfolio,
      ps = v.positions,
      ins = v.instruments;
    if (
      !record(s) ||
      !record(i) ||
      !record(p) ||
      !Array.isArray(ps) ||
      !Array.isArray(ins) ||
      !ps.every(record) ||
      !ins.every(record)
    )
      return false;
    if (
      s.account !== p.account ||
      i.account !== p.account ||
      i.portfolio !== p.id ||
      s.investment_account !== i.id ||
      i.latest_snapshot !== s.id ||
      s.position_count !== ps.length
    )
      return false;
    if (
      new Set(ps.map((x) => x.id)).size !== ps.length ||
      new Set(ps.map((x) => x.instrument)).size !== ps.length ||
      new Set(ins.map((x) => x.id)).size !== ins.length ||
      ins.length !== ps.length
    )
      return false;
    if (!record(s.as_of)) return false;
    let total = 0n,
      unknown = false;
    for (const x of ps) {
      if (
        x.account !== p.account ||
        x.snapshot !== s.id ||
        !ins.some((y) => y.id === x.instrument)
      )
        return false;
      if (x.valuation === null) {
        const units = decimal(x.quantity);
        if (units === undefined || units <= 0n) return false;
        unknown = true;
        continue;
      }
      if (
        x.quantity !== null ||
        !record(x.valuation) ||
        !record(x.valuation.as_of) ||
        !record(x.valuation.market_value) ||
        x.valuation.as_of.date !== s.as_of.date
      )
        return false;
      const amount = decimal(x.valuation.market_value.amount);
      if (amount === undefined) return false;
      total += amount;
    }
    if (unknown) {
      if (
        v.total_current_value !== null ||
        v.valuation_basis !== "supplied_quantity"
      )
        return false;
    } else if (
      !record(v.total_current_value) ||
      total !== decimal(v.total_current_value.amount) ||
      v.valuation_basis !== "manual_current_value"
    )
      return false;
  }
  const children =
    v.object === "list"
      ? v.data
      : v.object === "portfolio_history"
        ? v.holdings
        : v.snapshot && Array.isArray(v.positions)
          ? [v.portfolio, v.investment_account, v.snapshot, ...v.positions]
          : [];
  return (
    Array.isArray(children) && children.every((x) => consistent(x, account))
  );
}
