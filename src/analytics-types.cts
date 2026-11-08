import type { RequestOptions } from "./client-types.cjs";
export type AnalyticsPeriod = "1y" | "3y" | "5y" | "since_inception";
export type AnalyticsMetric =
  | { status: "available"; value: string; reason: null }
  | { status: "unavailable"; value: null; reason: string };
export interface PerformanceSelection {
  asOf: string;
  periods?: AnalyticsPeriod[];
}
export interface AnalyticsEnvelope {
  methodology_version: "ts-analytics-v1";
  requested_as_of: string;
  currency: "INR";
  source_cutoff: string;
  source_version: string;
  warnings: string[];
}
export interface PerformancePeriod {
  period: AnalyticsPeriod;
  requested_start: string | null;
  requested_end: string;
  status: "available" | "unavailable";
  reason: string | null;
  total_return_pct: AnalyticsMetric;
  cagr_pct: AnalyticsMetric;
}
export interface AnalyticsFreshnessPolicy {
  nav_days: number;
  aum_days: number;
  ter_days: number;
  category_min_funds: number;
  category_min_coverage_pct: number;
}
export interface SchemePerformance extends AnalyticsEnvelope {
  calculation_precision: "decimal_inputs_float64_returns";
  freshness_policy: AnalyticsFreshnessPolicy;
  available_history_start: string | null;
  inception_basis: "verified_first_scheme_nav" | null;
  scheme_nav_inception_date: string | null;
  object: "scheme_performance";
  scheme_id: string;
  fund_id: string;
  plan: string;
  option: string;
  basis: string;
  periods: (PerformancePeriod & {
    start_observation_date: string | null;
    end_observation_date: string | null;
    start_nav: string | null;
    end_nav: string | null;
    start_lag_days: number | null;
    end_lag_days: number | null;
    elapsed_days: number | null;
    annualization_basis: "observed_nav_dates_365_25";
  })[];
}
export interface CategorySelection {
  asOf: string;
  periods?: Exclude<AnalyticsPeriod, "since_inception">[];
  metrics?: "return"[];
  plan?: "direct" | "regular";
  option?: "growth";
}
export interface CategoryStatistics extends AnalyticsEnvelope {
  freshness_policy: AnalyticsFreshnessPolicy;
  object: "category_statistics";
  category: string;
  cohort: {
    policy: "current_classification_as_of_prices";
    plan: "direct" | "regular";
    option: "growth";
    fund_count: number;
    selected_scheme_count: number;
    classification_date: string | null;
  };
  metrics: Record<
    string,
    AnalyticsMetric & {
      method: "equal_weighted_arithmetic_mean";
      return_type: "total_return" | "cagr" | null;
      observation_date_min: string | null;
      observation_date_max: string | null;
      observed_elapsed_days_min: number | null;
      observed_elapsed_days_max: number | null;
      start_lag_days_max: number | null;
      end_lag_days_max: number | null;
      unit: string;
      eligible_count: number;
      valid_count: number;
      missing_count: number;
      stale_count: number;
      invalid_count: number;
      coverage_pct: string;
      exclusions: Record<string, number>;
    }
  >;
}
export interface AnalyticsResource<P, R> {
  retrieve(id: string, params: P, options?: RequestOptions): Promise<R>;
}

/** Current-vintage stored fund portfolio value, shared by plan/option variants. */
export interface AumSelection {
  asOf: string;
}
export interface FundAumData {
  fund_id: string;
  date: string;
  amount: string;
  currency: "INR";
  unit: "rupee";
  scope: "fund";
  basis: "stored_fund_portfolio_value";
  source: {
    table: "portfolios";
    field: "value_cents";
    portfolio_id: string;
    date: string;
    source_unit: "paise";
  };
}
export interface AumQuality {
  status: "fresh" | "stale";
  age_days: number;
  limit_days: number;
}
export type FundPortfolioAum = {
  object: "market_snapshot";
  requested_date: string;
} & (
  | {
      status: "available";
      observation_date: string;
      data: FundAumData;
      quality: AumQuality;
    }
  | { status: "missing"; observation_date: null; data: null }
  | {
      status: "unavailable";
      reason: string;
      observation_date: string | null;
      data: null;
      quality: AumQuality | null;
    }
);

export type FundAum = FundPortfolioAum & {
  fund_id: string;
  source_cutoff: string;
  source_version: string;
  history_basis: "current_source_vintage";
};
