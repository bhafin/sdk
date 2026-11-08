import type { RequestOptions } from "./client-types.cjs";
import type { AnalyticsMetric } from "./analytics-types.cjs";

/** Local candidate capability; not part of published SDK 0.7.0. */
export type BenchmarkPeriod = "1y" | "3y" | "5y";
export type IndexVariant = "tri" | "pri" | "adj_tri";
export interface MarketIndex {
  object: "index";
  id: string;
  name: string;
  variants: { id: string; type: IndexVariant }[];
  default_sub_index_id: string | null;
}
export interface IndexList {
  object: "list";
  data: MarketIndex[];
  has_more: boolean;
  url: "/v1/market-data/indexes";
}
export interface BenchmarkComponent {
  id: string;
  index_id: string;
  index_name: string;
  sub_index_id: string;
  variant: IndexVariant;
  benchmark_type: "fund" | "default" | "assigned";
  weight_pct: string;
}
export interface FundBenchmark {
  object: "fund_benchmark";
  fund_id: string;
  /** Present when requested through a scheme proxy. */
  scheme_id?: string;
  mapping_basis: "current_stored";
  components: BenchmarkComponent[];
}
export interface ComponentPerformance {
  sub_index_id: string;
  weight_pct: string;
  start_observation_date: string | null;
  end_observation_date: string | null;
  start_quote: string | null;
  end_quote: string | null;
  currency: string | null;
  start_lag_days: number | null;
  end_lag_days: number | null;
  elapsed_days: number | null;
  status: "available" | "unavailable";
  reason: string | null;
  total_return_pct: AnalyticsMetric;
  cagr_pct: AnalyticsMetric;
}
export interface BenchmarkPeriodResult {
  period: BenchmarkPeriod;
  requested_start: string;
  requested_end: string;
  status: "available" | "unavailable";
  reason: string | null;
  total_return_pct: AnalyticsMetric;
  cagr_pct: AnalyticsMetric;
  annualization_basis: "observed_quote_dates_365_25";
  components: ComponentPerformance[];
}
export interface BenchmarkPerformanceEnvelope {
  currency: "INR";
  requested_as_of: string;
  source_cutoff: string;
  source_version: string;
  methodology_version: "stored_weighted_component_returns_v1";
  basis: "stored_quotes";
  mapping_basis: "current_stored";
  weighting: "stored_percentage_weights_without_normalization";
  calculation_precision: "decimal_inputs_float64_returns";
  freshness_policy: { quote_days: number };
  components: BenchmarkComponent[];
  periods: BenchmarkPeriodResult[];
  warnings: string[];
}
export interface IndexPerformance extends BenchmarkPerformanceEnvelope {
  object: "index_performance";
  index_id: string;
  sub_index_id: string | null;
}
export interface FundBenchmarkPerformance extends BenchmarkPerformanceEnvelope {
  object: "fund_benchmark_performance";
  fund_id: string;
  scheme_id?: string;
}
export interface BenchmarkSelection {
  asOf: string;
  periods?: BenchmarkPeriod[];
}
export interface IndexPerformanceSelection extends BenchmarkSelection {
  subIndexId?: string;
}
export interface BenchmarkClient {
  retrieve(id: string, options?: RequestOptions): Promise<FundBenchmark>;
  readonly performance: {
    retrieve(
      id: string,
      selection: BenchmarkSelection,
      options?: RequestOptions,
    ): Promise<FundBenchmarkPerformance>;
  };
}
export interface IndexClient {
  list(
    query?: { query?: string; limit?: number; startingAfter?: string },
    options?: RequestOptions,
  ): Promise<IndexList>;
  retrieve(id: string, options?: RequestOptions): Promise<MarketIndex>;
  readonly performance: {
    retrieve(
      id: string,
      selection: IndexPerformanceSelection,
      options?: RequestOptions,
    ): Promise<IndexPerformance>;
  };
}
