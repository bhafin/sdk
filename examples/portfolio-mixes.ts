import type { Bharosa } from "bharosa";

export async function savedMixes(client: Bharosa, portfolioId: string) {
  const portfolio = await client.portfolios.retrieve(portfolioId);
  const snapshot = await portfolio.currentSnapshot();
  const cutoff = { asOf: "2026-10-18" };
  return {
    snapshot,
    asset: await portfolio.assetMix(cutoff),
    sector: await portfolio.sectorMix(cutoff),
    issuer: await portfolio.issuerMix(cutoff),
  };
}

export async function inMemoryMix(client: Bharosa, instrumentId: string) {
  const portfolio = client.portfolios.build({
    valuationDate: "2026-10-17",
    currency: "INR",
    positions: [
      {
        instrument: instrumentId,
        current_value: "100",
      },
    ],
  });
  return portfolio.assetMix({}, { timeoutMs: 10000, maxRetries: 1 });
}

export async function fundMixes(client: Bharosa, instrumentId: string) {
  const fund = client.mutualFunds.fromInstrument(instrumentId);
  return {
    asset: await fund.assetMix(),
    sector: await fund.portfolio.sectorMix(),
    issuer: await fund.issuerMix(),
  };
}

/** Load every page before presenting a choice; selection functions belong to your UI. */
export async function selectedSavedMix(
  client: Bharosa,
  select: (
    kind: "family" | "investor" | "portfolio",
    choices: ReadonlyArray<{ id: string; name?: string }>,
  ) => Promise<string>,
) {
  async function all<T extends { id: string }>(
    load: (cursor?: string) => Promise<{ data: T[]; has_more: boolean }>,
  ): Promise<T[]> {
    const rows: T[] = [];
    let cursor: string | undefined;
    for (;;) {
      const page = await load(cursor);
      rows.push(...page.data);
      if (!page.has_more) return rows;
      const next = page.data.at(-1)?.id;
      if (!next || next === cursor)
        throw new Error(
          "The list could not be completed. Try loading it again.",
        );
      cursor = next;
    }
  }
  const families = await all((cursor) =>
    client.clients.list({
      limit: 100,
      ...(cursor ? { startingAfter: cursor } : {}),
    }),
  );
  const familyId = await select("family", families);
  if (!families.some((f) => f.id === familyId))
    throw new Error("Choose a family from the returned list.");
  const investors = await all((cursor) =>
    client.investors.list({
      client: familyId,
      limit: 100,
      ...(cursor ? { startingAfter: cursor } : {}),
    }),
  );
  const investorId = await select("investor", investors);
  if (!investors.some((i) => i.id === investorId))
    throw new Error("Choose an investor from this family.");
  const portfolios = (
    await all((cursor) =>
      client.portfolios.list({
        client: familyId,
        limit: 100,
        ...(cursor ? { startingAfter: cursor } : {}),
      }),
    )
  ).filter((p) => p.investor === investorId);
  const portfolioId = await select("portfolio", portfolios);
  const portfolio = portfolios.find((p) => p.id === portfolioId);
  if (!portfolio)
    throw new Error("Choose a saved portfolio belonging to this investor.");
  return {
    snapshot: await portfolio.currentSnapshot(),
    asset: await portfolio.assetMix(),
  };
}
