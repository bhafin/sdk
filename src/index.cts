import { benchmarkMethods, indexMethods } from "./benchmark-methods.cjs";
import type * as B from "./benchmark-types.cjs";
export type * from "./benchmark-types.cjs";
import type * as A from "./analytics-types.cjs";
export type * from "./analytics-types.cjs";
import type { MonthlyMarketClient, MonthSelection } from "./monthly-types.cjs";
export type * from "./monthly-types.cjs";
import { createTransport, check, keys } from "./transport.cjs";
import { InvalidResponseError } from "./errors.cjs";
import { schemas } from "./contract.cjs";
import { valid } from "./validate.cjs";
import type * as T from "./client-types.cjs";
import type * as M from "./models.cjs";
import type * as D from "./market-types.cjs";
export type * from "./client-types.cjs";
export * from "./errors.cjs";
function methods<A extends object, B extends object>(
  data: A,
  additions: B,
): A & B {
  for (const [name, value] of Object.entries(additions))
    Object.defineProperty(data, name, { value });
  // Every key of additions was installed as a non-enumerable, immutable property.
  return data as A & B;
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function checkedDate(value: string): string {
  check(
    valid(
      { type: "string", format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      value,
    ),
  );
  return value;
}
const analyticsQuery = (
  q: A.PerformanceSelection | A.CategorySelection,
  extra: string[] = [],
) => {
  keys(q, ["asOf", "periods", ...extra]);
  checkedDate(q.asOf);
  check(q.asOf.endsWith("-01"));
  if (q.periods !== undefined)
    check(
      Array.isArray(q.periods) &&
        q.periods.length > 0 &&
        q.periods.length <= 4 &&
        new Set(q.periods).size === q.periods.length &&
        q.periods.every((p) =>
          ["1y", "3y", "5y", "since_inception"].includes(p),
        ),
    );
  return {
    as_of: q.asOf,
    ...(q.periods === undefined ? {} : { periods: q.periods.join(",") }),
  };
};

function categoryMethods(
  call: ReturnType<typeof createTransport>,
): T.ClientSurface["fundCategories"] {
  return Object.freeze({
    statistics: Object.freeze({
      retrieve: (id: string, q: A.CategorySelection, o?: T.RequestOptions) => {
        const query = analyticsQuery(q, ["metrics", "plan", "option"]);
        if (q.metrics !== undefined)
          check(
            Array.isArray(q.metrics) &&
              q.metrics.length > 0 &&
              q.metrics.length <= 3 &&
              new Set(q.metrics).size === q.metrics.length &&
              q.metrics.every((m) => m === "return"),
          );
        check(
          !(q.periods as string[] | undefined)?.includes("since_inception"),
        );
        check(!(q.metrics && !q.metrics.includes("return") && q.periods));
        return call(
          "analytics_category",
          {
            id,
            ...query,
            ...(q.metrics ? { metrics: q.metrics.join(",") } : {}),
            ...(q.plan ? { plan: q.plan } : {}),
            ...(q.option ? { option: q.option } : {}),
          },
          undefined,
          o,
        );
      },
    }),
  });
}
type Target = M.PortfolioMixRequest["portfolio"];
export class Bharosa implements T.ClientSurface {
  readonly accounts: T.ClientSurface["accounts"];
  readonly clients: T.ClientSurface["clients"];
  readonly investors: T.ClientSurface["investors"];
  readonly portfolios: T.ClientSurface["portfolios"];
  readonly fundCategories: T.ClientSurface["fundCategories"];
  readonly mutualFunds: T.ClientSurface["mutualFunds"];
  readonly mutualFundSchemes: T.ClientSurface["mutualFundSchemes"];
  readonly markets: BaselineMarketClient;
  readonly marketSnapshots: MonthlyMarketClient;
  readonly marketData: D.MarketDataClient;
  constructor(config: T.BharosaConfig) {
    const marketCall = createTransport(config, true);
    this.markets = baselineMarkets(marketCall);
    const call = createTransport(config);
    this.fundCategories = categoryMethods(call);

    const list = (p: T.FilteredListOptions) => {
      keys(p, ["limit", "startingAfter", "client"]);
      return Object.fromEntries(
        Object.entries(p)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k === "startingAfter" ? "starting_after" : k, v]),
      );
    };
    const portfolioList = (p: T.PortfolioListOptions) => {
      keys(p, [
        "limit",
        "startingAfter",
        "client",
        "client_ids",
        "investor_ids",
      ]);
      check(
        [p.client, p.client_ids, p.investor_ids].filter((v) => v !== undefined)
          .length <= 1,
      );
      return Object.fromEntries(
        Object.entries(p)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k === "startingAfter" ? "starting_after" : k, v]),
      );
    };
    this.accounts = Object.freeze({
      retrieve: (o?: T.RequestOptions) =>
        call("retrieve_account", {}, undefined, o),
    });
    this.clients = Object.freeze({
      list: (p: T.ListOptions = {}, o?: T.RequestOptions) =>
        call("list_clients", list(p), undefined, o),
      retrieve: (client: string, o?: T.RequestOptions) =>
        call("retrieve_client", { client }, undefined, o),
    });
    this.investors = Object.freeze({
      list: (p: T.FilteredListOptions = {}, o?: T.RequestOptions) =>
        call("list_investors", list(p), undefined, o),
      retrieve: (investor: string, o?: T.RequestOptions) =>
        call("retrieve_investor", { investor }, undefined, o),
      create: (b: M.InvestorCreate, o: T.IdempotentOptions) =>
        call("create_investor", {}, b, o),
      update: (investor: string, b: M.InvestorUpdate, o?: T.RequestOptions) =>
        call("update_investor", { investor }, b, o),
    });
    const mixMethods = (
      target: Target,
      positionDate?: string,
    ): T.DatedPortfolioMethods => {
      const invoke = <K extends "asset" | "sector" | "issuer">(
        kind: K,
        params: T.MixOptions & { valuationDate?: string } = {},
        o?: T.RequestOptions,
      ) => {
        keys(params, positionDate ? ["asOf", "valuationDate"] : ["asOf"]);
        if (params.asOf !== undefined) checkedDate(params.asOf);
        return call(
          `${kind}_mix`,
          {},
          {
            portfolio: target,
            ...(params.asOf === undefined ? {} : { as_of: params.asOf }),
            ...(positionDate === undefined
              ? {}
              : { position_date: positionDate }),
            ...(params.valuationDate === undefined
              ? {}
              : { valuation_date: checkedDate(params.valuationDate) }),
          },
          o,
        );
      };
      const common: T.DatedPortfolioMethods = {
        assetMix: (p, o) => invoke("asset", p, o),
        sectorMix: (p, o) => invoke("sector", p, o),
        issuerMix: (p, o) => invoke("issuer", p, o),
        on: (date) =>
          Object.freeze(methods({}, mixMethods(target, checkedDate(date)))),
      };
      return common;
    };
    const holdingObject = (data: M.Holding): T.HoldingObject => {
      const scope = { portfolio: data.portfolio, holding: data.id };
      return methods(data, {
        positionOn: (date: string, o?: T.RequestOptions) =>
          call(
            "holding_position",
            { ...scope, date: checkedDate(date) },
            undefined,
            o,
          ),
      });
    };
    const savedPortfolio = (data: M.Portfolio): T.PortfolioObject => {
      const target: Target = freeze({ type: "saved", id: data.id }),
        scope = { portfolio: data.id };
      const common = mixMethods(target);
      return methods(data, {
        ...common,
        current: (): T.CurrentPortfolioMethods =>
          Object.freeze({
            assetMix: (p: Record<string, never> = {}, o?: T.RequestOptions) => {
              keys(p, []);
              return call("current_asset_mix", {}, { portfolio: target }, o);
            },
            sectorMix: (
              p: Record<string, never> = {},
              o?: T.RequestOptions,
            ) => {
              keys(p, []);
              return call("current_sector_mix", {}, { portfolio: target }, o);
            },
            issuerMix: (
              p: Record<string, never> = {},
              o?: T.RequestOptions,
            ) => {
              keys(p, []);
              return call("current_issuer_mix", {}, { portfolio: target }, o);
            },
          }),
        currentSnapshot: (o?: T.RequestOptions) =>
          this.portfolios.snapshots.retrieveCurrent(scope.portfolio, o),
        history: Object.freeze({
          retrieve: (o?: T.RequestOptions) =>
            call("retrieve_history", scope, undefined, o),
          import: (body: M.HistoryImport, o: T.IdempotentOptions) =>
            call("import_history", scope, body, o),
          canReconstruct: (date: string, o?: T.RequestOptions) =>
            call(
              "history_capabilities",
              { ...scope, date: checkedDate(date) },
              undefined,
              o,
            ),
        }),
        holdings: Object.freeze({
          setCurrent: (body: D.CurrentHoldingsInput, o: T.IdempotentOptions) =>
            call("current_holdings", scope, body, o),
          retrieve: async (holding: string, o?: T.RequestOptions) =>
            holdingObject(
              await call(
                "retrieve_holding",
                { ...scope, holding },
                undefined,
                o,
              ),
            ),
          list: async (
            params: { date?: string } = {},
            o?: T.RequestOptions,
          ) => {
            keys(params, ["date"]);
            const result = await call(
              "list_holdings",
              {
                ...scope,
                ...(params.date === undefined
                  ? {}
                  : { date: checkedDate(params.date) }),
              },
              undefined,
              o,
            );
            return { ...result, data: result.data.map(holdingObject) };
          },
        }),
      });
    };
    const snapshot = (data: M.SnapshotView): T.SnapshotPortfolioView => ({
      ...data,
      portfolio: savedPortfolio(data.portfolio),
    });
    const build = (input: T.InMemoryPortfolioInput): T.InMemoryPortfolio => {
      keys(input, ["valuationDate", "positions", "currency"]);
      const target = {
        type: "in_memory" as const,
        valuation_date: input.valuationDate,
        currency: input.currency ?? "INR",
        positions: input.positions,
      };
      check(valid(schemas.PortfolioMixRequest, { portfolio: target }));
      const copied = freeze({
        ...target,
        positions: structuredClone([...input.positions]),
      });
      return methods(
        {},
        { ...mixMethods(copied), positions: copied.positions },
      );
    };
    this.portfolios = Object.freeze({
      update: async (
        portfolio: string,
        b: M.PortfolioUpdate,
        o: T.IdempotentOptions,
      ) => savedPortfolio(await call("update_portfolio", { portfolio }, b, o)),
      build,
      fromPositions: build,
      list: async (p: T.PortfolioListOptions = {}, o?: T.RequestOptions) => {
        const result = await call(
          "list_portfolios",
          portfolioList(p),
          undefined,
          o,
        );
        return { ...result, data: result.data.map(savedPortfolio) };
      },
      retrieve: async (portfolio: string, o?: T.RequestOptions) =>
        savedPortfolio(
          await call("retrieve_portfolio", { portfolio }, undefined, o),
        ),
      create: async (b: M.PortfolioCreate, o: T.IdempotentOptions) =>
        snapshot(await call("create_portfolio", {}, b, o)),
      snapshots: Object.freeze({
        retrieveCurrent: async (portfolio: string, o?: T.RequestOptions) =>
          snapshot(await call("current_snapshot", { portfolio }, undefined, o)),
        create: async (
          portfolio: string,
          b: M.SnapshotCreate,
          o: T.IdempotentOptions,
        ) => snapshot(await call("replace_snapshot", { portfolio }, b, o)),
      }),
    });
    const instrumentFund = <A extends object>(
      target: Target,
      data: A,
    ): A & T.MutualFundObject => {
      const common = mixMethods(target);
      return methods(data, { portfolio: common, ...common });
    };
    const fund = <A extends object>(
      target: Extract<Target, { type: "mutual_fund" }>,
      data: A,
    ): A & T.PublicMutualFundObject => {
      const common = mixMethods(target),
        portfolio = async (
          selection: Partial<MonthSelection> = {},
          options?: T.RequestOptions,
        ): Promise<T.FundPortfolioResource | null> => {
          keys(selection, ["asOf"]);
          const asOf = selection.asOf;
          if (asOf !== undefined) {
            checkedDate(asOf);
            check(asOf.endsWith("-01"));
          }
          check(target.type === "mutual_fund");
          const id = target.mutual_fund_id;
          const selected = await marketCall(
            "monthly_portfolio",
            { id, ...(asOf === undefined ? {} : { as_of: asOf }) },
            undefined,
            options,
          );
          if (selected.status === "missing") return null;
          const selectedId = selected.data.id,
            selectedDate = selected.observation_date;
          return methods(
            {
              ...selected.data,
              requested_date: selected.requested_date,
              observation_date: selectedDate,
            },
            {
              holdings: async (
                query: D.MarketPage = {},
                requestOptions?: T.RequestOptions,
              ) => {
                keys(query, ["limit", "startingAfter"]);
                const response = await marketCall(
                  "monthly_holdings",
                  {
                    id,
                    ...(asOf === undefined ? {} : { as_of: asOf }),
                    portfolio_id: selectedId,
                    portfolio_date: selectedDate,
                    ...(query.limit === undefined
                      ? {}
                      : { limit: query.limit }),
                    ...(query.startingAfter === undefined
                      ? {}
                      : { starting_after: query.startingAfter }),
                  },
                  undefined,
                  requestOptions,
                );
                if (
                  response.status !== "available" ||
                  response.data.portfolio.id !== selectedId ||
                  response.observation_date !== selectedDate
                )
                  throw new InvalidResponseError();
                return response.data.holdings;
              },
            },
          );
        };
      return methods(data, {
        portfolio,
        schemes: async (q: T.SchemeListQuery = {}, o?: T.RequestOptions) => {
          check(target.type === "mutual_fund");
          keys(q, ["limit", "startingAfter", "query", "plan", "option"]);
          const result = await marketCall(
            "listMutualFundSchemes",
            {
              id: target.mutual_fund_id,
              limit: q.limit,
              query: q.query,
              plan: q.plan,
              option: q.option,
              starting_after: q.startingAfter,
            },
            undefined,
            o,
          );
          if (result.data.some((row) => row.fund_id !== target.mutual_fund_id))
            throw new InvalidResponseError();
          return { ...result, data: result.data.map(scheme) };
        },
        ...common,
      });
    };
    const scheme = (row: D.FundScheme): T.MutualFundSchemeObject => {
      const data = {
        ...row,
        mutual_fund_id: row.fund_id,
        plan:
          row.plan_code === null
            ? null
            : ([
                "Institutional",
                "Regular",
                "Super institutional",
                "Institutional plus",
                "Direct",
                "Regular (standard)",
              ][row.plan_code] ?? null),
        option:
          row.option_code === null
            ? null
            : (["Growth", "Dividend / IDCW", "Bonus"][row.option_code] ?? null),
      };
      return hydrateScheme(data);
    };
    const hydrateScheme = <
      S extends Omit<T.MutualFundSchemeObject, "fund" | "nav">,
    >(
      data: S,
    ): S & T.MutualFundSchemeObject => {
      // Bind identities once; public result fields may be edited by callers.
      const id = data.id,
        parent = data.mutual_fund_id;
      const validId = (v: string) =>
        /^[1-9][0-9]{0,18}$/.test(v) && BigInt(v) <= 9223372036854775807n;
      if (!validId(id) || (parent !== null && !validId(parent)))
        throw new InvalidResponseError();
      return methods(data, {
        fund: async (o?: T.RequestOptions) =>
          parent === null ? null : this.mutualFunds.retrieve(parent, o),
        nav: async (q: { asOf?: string } = {}, o?: T.RequestOptions) =>
          this.markets.schemes.nav(id, q, o),
      });
    };
    this.mutualFunds = Object.freeze({
      retrieve: async (id: string, options?: T.RequestOptions) => {
        const data = await marketCall(
          "baseline_fund",
          { id },
          undefined,
          options,
        );
        if (data.id !== id) throw new InvalidResponseError();
        return fund(
          { type: "mutual_fund", mutual_fund_id: id },
          data,
        ) as D.FundOwner & T.PublicMutualFundObject;
      },
      aum: Object.freeze({
        retrieve: (id: string, q: A.AumSelection, o?: T.RequestOptions) => {
          keys(q, ["asOf"]);
          return call(
            "analytics_aum",
            { id, ...analyticsQuery(q) },
            undefined,
            o,
          );
        },
      }),
      portfolios: Object.freeze({
        retrieve: (id: string, q: MonthSelection, o?: T.RequestOptions) =>
          this.marketSnapshots.funds.portfolio(id, q, o),
        holdings: Object.freeze({
          list: (
            id: string,
            q: MonthSelection & D.MarketPage,
            o?: T.RequestOptions,
          ) => this.marketSnapshots.funds.holdings(id, q, o),
        }),
      }),
      fromId: (id: string) => {
        check(
          typeof id === "string" &&
            /^[1-9][0-9]{0,18}$/.test(id) &&
            BigInt(id) <= 9223372036854775807n,
        );
        return fund(
          { type: "mutual_fund", mutual_fund_id: id },
          { mutual_fund_id: id },
        ) as T.PublicMutualFundObject;
      },
      fromInstrument: (instrument: string) => {
        check(
          typeof instrument === "string" &&
            /^ins_[A-Za-z0-9_-]{1,150}$/.test(instrument),
        );
        return instrumentFund(
          { type: "fund_instrument", instrument },
          { instrument },
        );
      },
      search: async (
        p: { query: string; limit?: number },
        o?: T.RequestOptions,
      ) => {
        keys(p, ["query", "limit"]);
        check(
          typeof p.query === "string" &&
            p.query.trim().length >= 2 &&
            p.query.length <= 100,
        );
        const result = await marketCall("searchMutualFunds", p, undefined, o);
        return {
          ...result,
          data: result.data.map((row) =>
            fund({ type: "mutual_fund", mutual_fund_id: row.id }, row),
          ),
        };
      },
      references: async (
        p: { instruments: string[] },
        o?: T.RequestOptions,
      ) => {
        keys(p, ["instruments"]);
        check(
          Array.isArray(p.instruments) &&
            p.instruments.length >= 1 &&
            p.instruments.length <= 100 &&
            new Set(p.instruments).size === p.instruments.length &&
            p.instruments.every((x) =>
              valid(
                { type: "string", pattern: "^ins_[A-Za-z0-9_-]{1,150}$" },
                x,
              ),
            ),
        );
        const result = await call(
          "fund_references",
          { instruments: p.instruments.join(",") },
          undefined,
          o,
        );
        return {
          ...result,
          data: result.data.map((choice) => ({
            ...choice,
            instrument: instrumentFund(
              { type: "fund_instrument", instrument: choice.instrument.id },
              choice.instrument,
            ),
          })),
        };
      },
    });
    const query = (
      q: D.MarketFilter & D.MarketRange & { fund?: string } = {},
    ) => {
      keys(q, [
        "limit",
        "startingAfter",
        "query",
        "amc",
        "category",
        "manager",
        "fund",
        "from",
        "to",
      ]);
      const { startingAfter, ...rest } = q;
      return {
        ...rest,
        ...(startingAfter === undefined
          ? {}
          : { starting_after: startingAfter }),
      };
    };
    const monthlyQuery = (q: MonthSelection & D.MarketPage, paging = false) => {
      keys(q, paging ? ["asOf", "limit", "startingAfter"] : ["asOf"]);
      return {
        as_of: q.asOf,
        ...(q.limit === undefined ? {} : { limit: q.limit }),
        ...(q.startingAfter === undefined
          ? {}
          : { starting_after: q.startingAfter }),
      };
    };
    this.marketSnapshots = {
      schemes: {
        nav: (id, q = {}, o) => {
          keys(q, ["asOf"]);
          return call(
            "monthly_nav",
            { id, ...(q.asOf === undefined ? {} : { as_of: q.asOf }) },
            undefined,
            o,
          );
        },
        expenseRatio: (id, q, o) =>
          call("monthly_expense", { id, ...monthlyQuery(q) }, undefined, o),
        valuation: (id, input = {}, o) => {
          keys(input, ["units", "asOf", "positionDate", "observedValue"]);
          return call(
            "monthly_valuation",
            {},
            {
              scheme_id: id,
              ...(input.units === undefined ? {} : { units: input.units }),
              ...(input.asOf === undefined ? {} : { as_of: input.asOf }),
              ...(input.positionDate === undefined
                ? {}
                : { position_date: input.positionDate }),
              ...(input.observedValue === undefined
                ? {}
                : { observed_value: input.observedValue }),
            },
            o,
          );
        },
      },
      funds: {
        portfolio: (id, q, o) =>
          call("monthly_portfolio", { id, ...monthlyQuery(q) }, undefined, o),
        holdings: (id, q, o) =>
          call(
            "monthly_holdings",
            { id, ...monthlyQuery(q, true) },
            undefined,
            o,
          ),
      },
    };
    this.mutualFundSchemes = Object.freeze({
      retrieve: async (id: string, o?: T.RequestOptions) => {
        check(
          typeof id === "string" &&
            /^[1-9][0-9]{0,18}$/.test(id) &&
            BigInt(id) <= 9223372036854775807n,
        );
        const row = await marketCall(
          "retrieveMutualFundScheme",
          { id },
          undefined,
          o,
        );
        if (row.id !== id) throw new InvalidResponseError();
        return scheme(row);
      },
      search: async (
        p: { query: string; limit?: number },
        o?: T.RequestOptions,
      ) => {
        const result = await this.markets.schemes.search(p, o);
        return {
          ...result,
          data: result.data.map((row) =>
            hydrateScheme({
              ...row,
              id: row.scheme_id,
              mutual_fund_id:
                typeof row.mutual_fund_id === "string"
                  ? row.mutual_fund_id
                  : null,
              fund_name: row.instrument.mutual_fund?.fund_name ?? null,
              plan: row.plan_label,
              option: row.option_label,
              amfi_code: row.amfi_code,
              isin: row.isin,
            }),
          ),
        };
      },
      performance: Object.freeze({
        retrieve: (
          id: string,
          q: A.PerformanceSelection,
          o?: T.RequestOptions,
        ) =>
          call("analytics_scheme", { id, ...analyticsQuery(q) }, undefined, o),
      }),
      navs: Object.freeze({ retrieve: this.marketSnapshots.schemes.nav }),
      expenseRatios: Object.freeze({
        retrieve: this.marketSnapshots.schemes.expenseRatio,
      }),
      valuation: this.marketSnapshots.schemes.valuation,
    });
    this.marketData = Object.freeze({
      funds: {
        list: (q, o) => call("md_funds", query(q), undefined, o),
        retrieve: (id, o) => call("md_funds_get", { id }, undefined, o),
        portfolios: (id, q, o) =>
          call("md_portfolios", { id, ...query(q) }, undefined, o),
      },
      schemes: {
        list: (q, o) => call("md_schemes", query(q), undefined, o),
        retrieve: (id, o) => call("md_schemes_get", { id }, undefined, o),
        navs: (id, q, o) => call("md_navs", { id, ...query(q) }, undefined, o),
        expenseRatios: (id, q, o) =>
          call("md_expenses", { id, ...query(q) }, undefined, o),
        valuation: (id, input = {}, o) => {
          keys(input, ["units", "asOf", "positionDate", "observedValue"]);
          const { units, asOf, positionDate, observedValue } = input;
          return call(
            "md_valuation",
            {},
            {
              scheme_id: id,
              ...(units === undefined ? {} : { units }),
              ...(asOf === undefined ? {} : { as_of: asOf }),
              ...(positionDate === undefined
                ? {}
                : { position_date: positionDate }),
              ...(observedValue === undefined
                ? {}
                : { observed_value: observedValue }),
            },
            o,
          );
        },
      },
      amcs: {
        list: (q, o) => call("md_amcs", query(q), undefined, o),
        retrieve: (id, o) => call("md_amcs_get", { id }, undefined, o),
      },
      managers: {
        list: (q, o) => call("md_managers", query(q), undefined, o),
        retrieve: (id, o) => call("md_managers_get", { id }, undefined, o),
      },
      categories: {
        list: (q, o) => call("md_categories", query(q), undefined, o),
      },
      portfolios: {
        holdings: (id, q, o) =>
          call("md_holdings", { id, ...query(q) }, undefined, o),
      },
    } satisfies D.MarketDataClient);
    for (const collection of Object.values(this.marketData))
      Object.freeze(collection);
    Object.freeze(this);
  }
}

export interface BharosaMarketConfig {
  /** Defaults to https://api.bharosa.finance. */
  baseUrl?: string;
  apiKey: string;
  allowLocalhostHttp?: boolean;
  maxResponseBytes?: number;
  fetch?: typeof globalThis.fetch;
}
/** Server-only baseline market access. No account or user token. */
export class BharosaMarket {
  readonly schemes: BaselineMarketClient["schemes"];
  readonly categories: BaselineMarketClient["categories"];
  readonly funds: BaselineMarketClient["funds"];
  readonly indexes: B.IndexClient;
  constructor(config: BharosaMarketConfig) {
    keys(config, [
      "baseUrl",
      "apiKey",
      "allowLocalhostHttp",
      "maxResponseBytes",
      "fetch",
    ]);
    const { apiKey, ...rest } = config;
    const call = createTransport(
      { ...rest, account: "me", auth: { type: "account_key", apiKey } },
      true,
    );
    const resources = baselineMarkets(call);
    this.schemes = resources.schemes;
    this.categories = resources.categories;
    this.funds = resources.funds;
    this.indexes = resources.indexes;
  }
}
export interface BaselineMarketClient {
  readonly indexes: B.IndexClient;
  readonly categories: T.ClientSurface["fundCategories"];
  readonly schemes: {
    benchmark: B.BenchmarkClient;
    references(
      query: { instruments: string[] },
      options?: T.RequestOptions,
    ): Promise<M.FundReferences>;
    performance: T.ClientSurface["mutualFundSchemes"]["performance"];
    valuation: MonthlyMarketClient["schemes"]["valuation"];
    search(
      query: { query: string; limit?: number },
      options?: T.RequestOptions,
    ): Promise<M.FundsList>;
    nav(
      id: string,
      selection?: { asOf?: string },
      options?: T.RequestOptions,
    ): ReturnType<MonthlyMarketClient["schemes"]["nav"]>;
    expenseRatio: MonthlyMarketClient["schemes"]["expenseRatio"];
  };
  readonly funds: MonthlyMarketClient["funds"] & {
    readonly aum: T.ClientSurface["mutualFunds"]["aum"];
    readonly benchmark: B.BenchmarkClient;
  };
}
function baselineMarkets(
  call: ReturnType<typeof createTransport>,
): BaselineMarketClient {
  const query = (q: MonthSelection & D.MarketPage, paging = false) => {
    keys(q, paging ? ["asOf", "limit", "startingAfter"] : ["asOf"]);
    return {
      as_of: q.asOf,
      ...(q.limit === undefined ? {} : { limit: q.limit }),
      ...(q.startingAfter === undefined
        ? {}
        : { starting_after: q.startingAfter }),
    };
  };
  const schemes: BaselineMarketClient["schemes"] = {
    benchmark: benchmarkMethods(call, "scheme"),
    references: (p, o) => {
      keys(p, ["instruments"]);
      check(
        Array.isArray(p.instruments) &&
          p.instruments.length >= 1 &&
          p.instruments.length <= 100 &&
          new Set(p.instruments).size === p.instruments.length &&
          p.instruments.every(
            (x) =>
              typeof x === "string" && /^ins_[A-Za-z0-9_-]{1,150}$/.test(x),
          ),
      );
      return call(
        "fund_references",
        { instruments: p.instruments.join(",") },
        undefined,
        o,
      );
    },
    performance: Object.freeze({
      retrieve: (id: string, q: A.PerformanceSelection, o?: T.RequestOptions) =>
        call("analytics_scheme", { id, ...analyticsQuery(q) }, undefined, o),
    }),
    valuation: (id, input = {}, o) => {
      keys(input, ["units", "asOf", "positionDate", "observedValue"]);
      return call(
        "monthly_valuation",
        {},
        {
          scheme_id: id,
          units: input.units,
          ...(input.asOf === undefined ? {} : { as_of: input.asOf }),
          ...(input.positionDate === undefined
            ? {}
            : { position_date: input.positionDate }),
          ...(input.observedValue === undefined
            ? {}
            : { observed_value: input.observedValue }),
        },
        o,
      );
    },
    search: async (p, o) => {
      keys(p, ["query", "limit"]);
      check(
        typeof p.query === "string" &&
          p.query.trim().length >= 2 &&
          p.query.length <= 100,
      );
      return call("searchMarketSchemes", p, undefined, o);
    },
    nav: (id, q = {}, o) => {
      keys(q, ["asOf"]);
      return call(
        "monthly_nav",
        { id, ...(q.asOf === undefined ? {} : { as_of: q.asOf }) },
        undefined,
        o,
      );
    },
    expenseRatio: (id, q, o) =>
      call("monthly_expense", { id, ...query(q) }, undefined, o),
  };
  const funds: BaselineMarketClient["funds"] = {
    aum: Object.freeze({
      retrieve: (id: string, q: A.AumSelection, o?: T.RequestOptions) => {
        keys(q, ["asOf"]);
        return call(
          "analytics_aum",
          { id, ...analyticsQuery(q) },
          undefined,
          o,
        );
      },
    }),
    benchmark: benchmarkMethods(call, "fund"),
    portfolio: (id, q, o) =>
      call("monthly_portfolio", { id, ...query(q) }, undefined, o),
    holdings: (id, q, o) =>
      call("monthly_holdings", { id, ...query(q, true) }, undefined, o),
  };
  return Object.freeze({
    schemes: Object.freeze(schemes),
    funds: Object.freeze(funds),
    categories: categoryMethods(call),
    indexes: indexMethods(call),
  });
}
