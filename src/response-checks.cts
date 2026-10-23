import { record, type Operation } from "./schema.cjs";
import { valid, consistent } from "./validate.cjs";
export function field(value: unknown, ...path: string[]): unknown {
  for (const key of path) {
    if (!record(value)) return undefined;
    value = value[key];
  }
  return value;
}
function rows(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function later(a: unknown, b: unknown): boolean {
  return typeof a === "string" && typeof b === "string" && a > b;
}
function decimal(v: unknown): unknown {
  return typeof v === "string"
    ? v.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")
    : v;
}
export function responseMatches(
  id: string,
  op: Operation,
  data: unknown,
  params: Record<string, unknown>,
  body: unknown,
  account: string,
): boolean {
  if (!valid(op.response, data) || !consistent(data, account)) return false;
  const d = (...p: string[]) => field(data, ...p),
    b = (...p: string[]) => field(body, ...p);
  if (
    id.startsWith("current_") &&
    id.endsWith("_mix") &&
    (d("portfolio") !== b("portfolio", "id") ||
      d("mix_type") !== id.split("_")[1] ||
      d("current_valuation", "valuation_date") !== d("valuation_date") ||
      rows(d("current_valuation", "holdings")).some(
        (h) =>
          later(field(h, "nav", "date"), field(h, "as_of")) ||
          later(field(h, "position_date"), field(h, "as_of")) ||
          field(h, "as_of") !== d("valuation_date"),
      ))
  )
    return false;
  if (op.marketData) {
    if (id.endsWith("_get") && d("id") !== params.id) return false;
    if (
      ["md_navs", "md_expenses", "md_portfolios", "md_holdings"].includes(id) &&
      rows(d("data")).some(
        (row) =>
          field(
            row,
            id === "md_portfolios"
              ? "fund_id"
              : id === "md_holdings"
                ? "portfolio_id"
                : "scheme_id",
          ) !== params.id,
      )
    )
      return false;
    if (
      id === "md_valuation" &&
      ((b("position_date") !== undefined &&
        d("position_date") !== b("position_date")) ||
        later(d("nav", "date"), d("as_of")) ||
        d("scheme_id") !== b("scheme_id") ||
        (b("as_of") !== undefined && d("as_of") !== b("as_of")) ||
        (d("status") === "unavailable" && d("value") !== undefined))
    )
      return false;
    if (id === "current_holdings") {
      const got = rows(d("holdings")),
        inputs = rows(b("holdings"));
      if (got.length !== inputs.length) return false;
      if (
        got.some((row, i) => {
          const input = field(inputs[i], "observed_position"),
            derivation = field(row, "derivation");
          return field(derivation, "kind") === "amount_divided_by_nav"
            ? field(derivation, "position_date") !== field(input, "date") ||
                decimal(field(derivation, "original_amount")) !==
                  decimal(field(input, "current_value", "amount")) ||
                later(field(derivation, "nav", "date"), field(input, "date")) ||
                field(derivation, "nav", "amount") === "0"
            : field(derivation, "kind") !== "supplied" ||
                field(input, "quantity") == null;
        })
      )
        return false;
    }
  }
  if (
    op.readOnly &&
    !op.marketData &&
    (d("mix_type") !== id.replace("_mix", "") ||
      d("portfolio") !==
        (b("portfolio", "type") === "saved" ? b("portfolio", "id") : null) ||
      (b("as_of") !== undefined && d("as_of_date") !== b("as_of")))
  )
    return false;
  if (
    Object.entries(params).some(
      ([k, v]) =>
        ["client", "investor", "portfolio"].includes(k) &&
        op.parameters.some((p) => p.in === "path" && p.name === k) &&
        !["history_capabilities", "list_holdings"].includes(id) &&
        (typeof d("portfolio") === "string"
          ? d("portfolio")
          : (d("portfolio", "id") ?? d("id"))) !== v,
    )
  )
    return false;
  if (
    (id === "retrieve_holding" && d("id") !== params.holding) ||
    (id === "holding_position" &&
      (d("holding") !== params.holding ||
        d("position_date") !== params.date)) ||
    (id === "history_capabilities" && d("date") !== params.date) ||
    (id === "list_holdings" &&
      rows(d("data")).some(
        (h) => field(h, "portfolio") !== params.portfolio,
      )) ||
    (op.readOnly &&
      !op.marketData &&
      b("position_date") !== undefined &&
      d("position_date") !== b("position_date")) ||
    (op.readOnly &&
      !op.marketData &&
      b("valuation_date") !== undefined &&
      d("valuation_date") !== b("valuation_date"))
  )
    return false;
  if (id === "fund_references") {
    if (typeof params.instruments !== "string") return false;
    const asked = params.instruments.split(","),
      got = [
        ...rows(d("data")).map((x) => field(x, "instrument", "id")),
        ...rows(d("missing")),
      ];
    if (
      new Set(got).size !== got.length ||
      got.length !== asked.length ||
      got.some((x) => typeof x !== "string" || !asked.includes(x))
    )
      return false;
  }
  return true;
}
