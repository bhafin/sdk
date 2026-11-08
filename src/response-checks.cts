import { benchmarkMatches } from "./benchmark-checks.cjs";
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
  if (id.startsWith("benchmark_")) return benchmarkMatches(id, data, params);
  if (
    id === "update_portfolio" &&
    (field(data, "id") !== params.portfolio ||
      field(data, "name") !== String(field(body, "name")).trim())
  )
    return false;
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
  if (
    [
      "list_clients",
      "list_investors",
      "list_portfolios",
      "list_holdings",
    ].includes(id)
  ) {
    const page = rows(d("data"));
    const ids = page.map((item) => field(item, "id"));
    if (
      new Set(ids).size !== ids.length ||
      (d("has_more") === true && page.length === 0) ||
      (params.starting_after !== undefined &&
        ids.includes(params.starting_after)) ||
      (typeof params.limit === "number" && page.length > params.limit)
    )
      return false;
  }
  if (id === "searchMutualFunds" || id === "listMutualFundSchemes") {
    const page = rows(d("data")),
      ids = page.map((row) => field(row, "id"));
    const limit =
      typeof params.limit === "number"
        ? params.limit
        : id === "searchMutualFunds"
          ? 10
          : 20;
    if (
      page.length > limit ||
      new Set(ids).size !== ids.length ||
      ids.some(
        (value) =>
          typeof value !== "string" ||
          !/^[1-9][0-9]{0,18}$/.test(value) ||
          BigInt(value) > 9223372036854775807n,
      ) ||
      (d("has_more") === true && page.length !== limit)
    )
      return false;
    if (id === "searchMutualFunds") {
      if (d("next_cursor") !== null) return false;
    } else {
      if (
        page.some((row) => field(row, "fund_id") !== params.id) ||
        ids.some(
          (value, i) =>
            BigInt(String(value)) <=
            BigInt(
              i ? String(ids[i - 1]) : String(params.starting_after ?? "0"),
            ),
        ) ||
        d("next_cursor") !== (d("has_more") ? ids.at(-1) : null)
      )
        return false;
    }
  }
  if (id === "retrieveMutualFundScheme" && d("id") !== params.id) return false;
  if (id === "searchMarketSchemes") {
    const page = rows(d("data"));
    if (
      d("url") !== op.path ||
      page.length > (typeof params.limit === "number" ? params.limit : 10) ||
      (d("has_more") === true && page.length === 0)
    )
      return false;
  }
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
      (id === "md_valuation" || id === "monthly_valuation") &&
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
  if (id.startsWith("analytics_")) {
    if (id === "analytics_aum") {
      if (
        d("fund_id") !== params.id ||
        d("requested_date") !== params.as_of ||
        (d("observation_date") !== null &&
          String(d("observation_date")) > String(params.as_of))
      )
        return false;
      if (
        d("status") === "available" &&
        field(d("data"), "basis") === "stored_fund_portfolio_value" &&
        field(field(d("data"), "source"), "date") !== d("observation_date")
      )
        return false;
      if (
        d("status") === "available" &&
        (field(d("data"), "fund_id") !== params.id ||
          field(d("data"), "date") !== d("observation_date") ||
          String(d("observation_date")) > String(params.as_of))
      )
        return false;
    } else {
      if (d("requested_as_of") !== params.as_of) return false;
      const identity =
        id === "analytics_scheme"
          ? "scheme_id"
          : id === "analytics_portfolio"
            ? "portfolio_id"
            : "category";
      if (d(identity) !== params.id) return false;
      if (id === "analytics_category") {
        if (
          d("cohort", "plan") !== (params.plan ?? "direct") ||
          d("cohort", "option") !== (params.option ?? "growth")
        )
          return false;
        const requested = String(params.metrics ?? "return").split(",");
        const expected = requested.flatMap((m) =>
          m === "return"
            ? String(params.periods ?? "1y,3y,5y")
                .split(",")
                .map((p) => "return_" + p)
            : [m],
        );
        for (const key of expected) {
          const metric = d("metrics", key);
          if (!record(metric)) return false;
          const eligible = Number(field(metric, "eligible_count")),
            valid = Number(field(metric, "valid_count"));
          const excluded = [
            "missing_count",
            "stale_count",
            "invalid_count",
          ].reduce((n, k) => n + Number(field(metric, k)), 0);
          if (
            eligible !== d("cohort", "fund_count") ||
            valid + excluded !== eligible
          )
            return false;
          if (
            field(metric, "status") === "available" &&
            (valid < 3 || valid * 100 < eligible * 80)
          )
            return false;
        }
      }
      if (id !== "analytics_category") {
        const expected = String(params.periods ?? "1y,3y,5y").split(",");
        const got = rows(d("periods"));
        if (
          got.length !== expected.length ||
          got.some(
            (p, i) =>
              field(p, "period") !== expected[i] ||
              field(p, "requested_end") !== params.as_of ||
              (id === "analytics_scheme" &&
                (later(
                  field(p, "start_observation_date"),
                  field(p, "requested_start"),
                ) ||
                  later(field(p, "end_observation_date"), params.as_of))),
          )
        )
          return false;
      }
    }
  }
  if (id.startsWith("monthly_") && id !== "monthly_valuation") {
    const observation = d("observation_date"),
      requested = d("requested_date"),
      data = d("data");
    if (
      !(
        ["monthly_nav", "monthly_portfolio", "monthly_holdings"].includes(id) &&
        params.as_of === undefined
      ) &&
      requested !== params.as_of
    )
      return false;
    if (d("status") === "available") {
      if (
        typeof observation !== "string" ||
        typeof requested !== "string" ||
        observation > requested
      )
        return false;
      if (id === "monthly_nav" || id === "monthly_expense") {
        if (
          field(data, "scheme_id") !== params.id ||
          field(data, "date") !== observation
        )
          return false;
      }
      if (
        id === "monthly_portfolio" &&
        (field(data, "fund_id") !== params.id ||
          field(data, "date") !== observation)
      )
        return false;
      if (id === "monthly_portfolio" || id === "monthly_holdings") {
        const portfolio =
          id === "monthly_portfolio" ? data : field(data, "portfolio");
        const aum = field(portfolio, "aum");
        if (
          aum !== undefined &&
          (field(aum, "requested_date") !== requested ||
            field(aum, "observation_date") !== observation ||
            (field(aum, "status") === "available" &&
              (field(aum, "data", "fund_id") !== params.id ||
                field(aum, "data", "date") !== observation ||
                field(aum, "data", "source", "portfolio_id") !==
                  field(portfolio, "id") ||
                field(aum, "data", "source", "date") !== observation)))
        )
          return false;
      }
      if (
        id === "monthly_holdings" &&
        (field(data, "portfolio", "fund_id") !== params.id ||
          field(data, "portfolio", "date") !== observation ||
          rows(field(data, "holdings", "data")).some(
            (h) =>
              field(h, "date") !== observation ||
              field(h, "portfolio_id") !== field(data, "portfolio", "id"),
          ))
      )
        return false;
    }
  }
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
