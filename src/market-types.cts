import type { RequestOptions } from "./client-types.cjs";
export interface MarketList<T> {
  object: "list";
  data: T[];
  has_more: boolean;
  next_cursor: string | null;
  source: "normalized_market_database";
  from?: string;
  to?: string;
  coverage?: "observations_only";
}
export interface MarketPage {
  limit?: number;
  startingAfter?: string;
}
export interface MarketFilter extends MarketPage {
  query?: string;
  amc?: string;
  category?: string;
  manager?: string;
}
export interface MarketRange extends MarketPage {
  from?: string;
  to?: string;
}
export interface FundOwner {
  id: string;
  name: string | null;
  amc_id: string | null;
  category: string | null;
  active: boolean | null;
  manager_ids: string[];
}
export interface FundScheme {
  id: string;
  fund_id: string;
  fund_name: string | null;
  amfi_code: string | null;
  isin: string | null;
  plan_code: number | null;
  option_code: number | null;
  status_code: number | null;
}
export interface MarketName {
  id: string;
  name: string | null;
}
export interface NavObservation {
  id: string;
  scheme_id: string;
  date: string;
  amount: string;
  currency: string;
}
export interface ExpenseObservation {
  id: string;
  scheme_id: string;
  date: string;
  value: string | null;
}
export interface FundPortfolio {
  id: string;
  fund_id: string;
  date: string;
}
export interface FundHolding {
  id: string;
  portfolio_id: string;
  date: string;
  asset_type: string;
  asset_id: string;
  units: string | null;
  value: { amount: string; currency: string };
}
export interface ValuationInput {
  units?: string | null;
  asOf?: string;
  positionDate?: string;
  observedValue?: string;
}
interface ValuationBase {
  scheme_id: string;
  as_of: string;
  position_date: string | null;
  ownership_status: "user_supplied_not_verified";
}
export type LatestNavValuation = ValuationBase &
  (
    | {
        status: "available";
        units: string;
        value: { amount: string; currency: "INR" };
        nav: { amount: string; currency: "INR"; date: string };
        freshness: {
          status: "recent" | "stale";
          age_days: number;
          recent_within_days: 3;
          time_zone: "Asia/Kolkata";
        };
        valuation_basis: "units_times_latest_nav";
      }
    | {
        status: "unavailable";
        reason: "quantity_missing" | "nav_missing";
        units?: string;
        observed_value: { amount: string; currency: "INR" } | null;
        value?: never;
      }
  );
interface NamedMarketCollection<T> {
  list(
    query?: MarketPage & { query?: string },
    options?: RequestOptions,
  ): Promise<MarketList<T>>;
  retrieve(id: string, options?: RequestOptions): Promise<T>;
}
export interface MarketDataClient {
  funds: {
    list(
      query?: MarketFilter,
      options?: RequestOptions,
    ): Promise<MarketList<FundOwner>>;
    retrieve(id: string, options?: RequestOptions): Promise<FundOwner>;
    portfolios(
      id: string,
      query?: MarketRange,
      options?: RequestOptions,
    ): Promise<MarketList<FundPortfolio>>;
  };
  schemes: {
    list(
      query?: MarketFilter & { fund?: string },
      options?: RequestOptions,
    ): Promise<MarketList<FundScheme>>;
    retrieve(id: string, options?: RequestOptions): Promise<FundScheme>;
    navs(
      id: string,
      query?: MarketRange,
      options?: RequestOptions,
    ): Promise<MarketList<NavObservation>>;
    expenseRatios(
      id: string,
      query?: MarketRange,
      options?: RequestOptions,
    ): Promise<MarketList<ExpenseObservation>>;
    valuation(
      id: string,
      input: ValuationInput,
      options?: RequestOptions,
    ): Promise<LatestNavValuation>;
  };
  amcs: NamedMarketCollection<MarketName>;
  managers: NamedMarketCollection<MarketName>;
  categories: {
    list(
      query?: MarketPage,
      options?: RequestOptions,
    ): Promise<MarketList<MarketName>>;
  };
  portfolios: {
    holdings(
      id: string,
      query?: MarketPage,
      options?: RequestOptions,
    ): Promise<MarketList<FundHolding>>;
  };
}

export type UnitDerivation =
  | { kind: "supplied" }
  | {
      kind: "amount_divided_by_nav";
      original_amount: string;
      position_date: string;
      nav: { amount: string; currency: string; date: string };
      rounding: "half_even_4_decimal_places" | "half_even_18_decimal_places";
      rounded: boolean;
    };
export interface CurrentHoldingsInput {
  source: { kind: "user" | "statement"; reference: string };
  holdings: Array<{
    expected_revision?: number;
    external_id: string;
    investment_account: string;
    instrument: string;
    observed_position: {
      date: string;
      quantity?: string | null;
      current_value?: { amount: string; currency: "INR" };
    };
  }>;
}
export interface CurrentHoldingsResult {
  object: "history_import";
  account: string;
  portfolio: string;
  holdings: Array<{
    id: string;
    revision: number;
    quantity: string;
    derivation: UnitDerivation;
  }>;
}
