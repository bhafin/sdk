"use strict";
const { schemas } = require("./contract.cjs");
function valid(s, v, depth = 0) {
  if (depth > 64) return false;
  if (s.$ref) return valid(schemas[s.$ref.split("/").pop()], v, depth + 1);
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
      if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
      const keys = Object.keys(v);
      return (
        (s.minProperties === undefined || keys.length >= s.minProperties) &&
        (s.required ?? []).every((k) => Object.hasOwn(v, k)) &&
        keys.every((k) =>
          Object.hasOwn(s.properties ?? {}, k)
            ? valid(s.properties[k], v[k], depth + 1)
            : s.additionalProperties !== false,
        )
      );
    }
    default:
      return true;
  }
}
function decimal(v) {
  const [a, b = ""] = v.split(".");
  return BigInt(a) * 10n ** 18n + BigInt(b.padEnd(18, "0"));
}
function consistent(v, account) {
  if (!v || typeof v !== "object") return true;
  if (
    [
      "client",
      "investor",
      "portfolio",
      "portfolio_mix",
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
    const {
      snapshot: s,
      investment_account: i,
      portfolio: p,
      positions: ps,
      instruments: ins,
    } = v;
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
    if (
      ps.some(
        (x) =>
          x.account !== p.account ||
          x.snapshot !== s.id ||
          x.valuation.as_of.date !== s.as_of.date ||
          !ins.some((y) => y.id === x.instrument),
      )
    )
      return false;
    if (
      ps.reduce((n, x) => n + decimal(x.valuation.market_value.amount), 0n) !==
      decimal(v.total_current_value.amount)
    )
      return false;
  }
  return (
    v.object === "list"
      ? v.data
      : v.snapshot && v.positions
        ? [v.portfolio, v.investment_account, v.snapshot, ...v.positions]
        : []
  ).every((x) => consistent(x, account));
}
module.exports = { valid, consistent };
