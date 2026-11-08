import { Bharosa } from "bharosa";

/** SDK 0.8.0 example. No request is made merely by importing it. */
export async function readBenchmark(
  bharosa: Bharosa,
  selectedFundId: string,
  asOf: string,
) {
  const composition =
    await bharosa.markets.funds.benchmark.retrieve(selectedFundId);
  const result = await bharosa.markets.funds.benchmark.performance.retrieve(
    selectedFundId,
    {
      asOf,
      periods: ["1y", "3y", "5y"],
    },
  );
  return {
    fundId: result.fund_id,
    components: composition.components,
    periods: result.periods.map((period) => ({
      period: period.period,
      metric:
        period.period === "1y" ? period.total_return_pct : period.cagr_pct,
      observations: period.components,
    })),
  };
}
