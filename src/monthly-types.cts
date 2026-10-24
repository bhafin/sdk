import type * as D from "./market-types.cjs";
import type { RequestOptions } from "./client-types.cjs";
export type MarketSnapshot<T> = {
  object: "market_snapshot";
  requested_date: string;
} & (
  | { status: "missing"; observation_date: null; data: null }
  | { status: "available"; observation_date: string; data: T }
);
export interface MonthlyHoldings {
  portfolio: D.FundPortfolio;
  holdings: D.MarketList<D.FundHolding>;
}
export interface MonthSelection {
  asOf: string;
}
export interface MonthlyMarketClient {
  schemes: {
    nav(
      id: string,
      query: MonthSelection,
      options?: RequestOptions,
    ): Promise<MarketSnapshot<D.NavObservation>>;
    expenseRatio(
      id: string,
      query: MonthSelection,
      options?: RequestOptions,
    ): Promise<MarketSnapshot<D.ExpenseObservation>>;
    valuation(
      id: string,
      input?: D.ValuationInput,
      options?: RequestOptions,
    ): Promise<D.LatestNavValuation>;
  };
  funds: {
    portfolio(
      id: string,
      query: MonthSelection,
      options?: RequestOptions,
    ): Promise<MarketSnapshot<D.FundPortfolio>>;
    holdings(
      id: string,
      query: MonthSelection & D.MarketPage,
      options?: RequestOptions,
    ): Promise<MarketSnapshot<MonthlyHoldings>>;
  };
}
