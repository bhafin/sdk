import type { Bharosa } from "bharosa";

export async function savedMixes(client: Bharosa, portfolioId: string) {
  const portfolio = await client.portfolios.retrieve(portfolioId);
  const snapshot = await portfolio.currentSnapshot();
  return {
    snapshot,
    asset: await portfolio.assetMix({ asOf: "2026-10-18" }),
    sector: await portfolio.sectorMix(),
    issuer: await portfolio.issuerMix(),
  };
}

export async function inMemoryMix(client: Bharosa) {
  const portfolio = client.portfolios.build({
    valuationDate: "2026-10-17",
    currency: "INR",
    positions: [
      {
        instrument: "ins_example_india_equity_direct_growth",
        current_value: "100",
      },
    ],
  });
  return portfolio.assetMix({}, { timeoutMs: 10000, maxRetries: 1 });
}

export async function fundMixes(client: Bharosa) {
  const fund = client.mutualFunds.fromInstrument(
    "ins_example_india_equity_direct_growth",
  );
  return {
    asset: await fund.assetMix(),
    sector: await fund.portfolio.sectorMix(),
    issuer: await fund.issuerMix(),
  };
}
