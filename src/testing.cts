/** Optional synthetic fixtures. No imports from the production entrypoint and no I/O on import. */
export type SampleScenario =
  "equity-heavy" | "mixed-allocation" | "overlapping-funds" | "new-investor";
export interface SamplePortfolio {
  id: SampleScenario;
  investorName: string;
  name: string;
  asOf: string;
  positions: { symbol: string; amount: string }[];
}
/** Labels describe fictional fixture composition, not assertions about mapped live funds. */
export function samplePortfolios(): SamplePortfolio[] {
  const make = (
    id: SampleScenario,
    positions: SamplePortfolio["positions"],
  ): SamplePortfolio => ({
    id,
    investorName: "Synthetic Demo Investor",
    name: `Synthetic ${id}`,
    asOf: "2026-01-01",
    positions,
  });
  return [
    make("equity-heavy", [
      { symbol: "synthetic:equity-a", amount: "80000" },
      { symbol: "synthetic:debt", amount: "20000" },
    ]),
    make("mixed-allocation", [
      { symbol: "synthetic:equity-a", amount: "50000" },
      { symbol: "synthetic:debt", amount: "30000" },
      { symbol: "synthetic:gold", amount: "20000" },
    ]),
    make("overlapping-funds", [
      { symbol: "synthetic:equity-a", amount: "60000" },
      { symbol: "synthetic:equity-b", amount: "40000" },
    ]),
    make("new-investor", []),
  ];
}
export interface SeedClient {
  accounts: { retrieve(): Promise<{ id: string }> };
  investors: {
    create(
      body: { name: string; relationship_to_owner: "other" },
      options: { idempotencyKey: string },
    ): Promise<{ id: string }>;
  };
  portfolios: {
    create(
      body: {
        name: string;
        investor: string;
        as_of: string;
        positions: { instrument: string; current_value: string }[];
      },
      options: { idempotencyKey: string },
    ): Promise<{ portfolio: { id: string } }>;
  };
}
export interface SeedOptions {
  /** Explicitly confirm an account you administer for testing. This does not attest server environment. */
  confirmTestAccount: string;
  /** Reuse for retries; choose a different value only for an intentionally separate seed. */
  runId: string;
  scenario: SampleScenario;
  /** Resolve real target-environment instruments yourself; fixture symbols are never API IDs. */
  instruments: Readonly<Record<string, string>>;
}
export interface SeedReceipt {
  account: string;
  investor: string;
  portfolio: string | null;
  scenario: SampleScenario;
}
export class SampleSeedError extends Error {
  constructor(
    readonly phase: "investor" | "portfolio",
    readonly investor: string | null,
    options: { cause: unknown },
  ) {
    super(
      `Sample ${phase} creation failed. An earlier step may have succeeded; retry with the same account, runId, scenario and instrument mapping.`,
      options,
    );
    this.name = "SampleSeedError";
  }
}
/** Explicit writes only. Two idempotent requests, not an atomic multi-resource transaction. */
export async function seedSamplePortfolio(
  client: SeedClient,
  options: SeedOptions,
): Promise<SeedReceipt> {
  if (
    !options ||
    typeof options.runId !== "string" ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(options.runId) ||
    typeof options.confirmTestAccount !== "string" ||
    !options.confirmTestAccount.startsWith("acct_")
  )
    throw new Error(
      "Confirm a developer test account and provide a stable runId before seeding.",
    );
  const scenario = samplePortfolios().find((s) => s.id === options.scenario);
  if (!scenario) throw new Error("Choose a supported synthetic scenario.");
  const positions = scenario.positions.map((p) => {
    const instrument = options.instruments?.[p.symbol];
    if (
      typeof instrument !== "string" ||
      !/^ins_[A-Za-z0-9_-]{1,150}$/.test(instrument)
    )
      throw new Error(
        `Resolve a valid instrument for ${p.symbol} in your test environment before seeding.`,
      );
    return { instrument, current_value: p.amount };
  });
  if (new Set(positions.map((p) => p.instrument)).size !== positions.length)
    throw new Error(
      "Each sample symbol requires a distinct instrument mapping.",
    );
  const account = await client.accounts.retrieve();
  if (account.id !== options.confirmTestAccount)
    throw new Error(
      "Authenticated account does not match the confirmed developer test account; no sample was written.",
    );
  const prefix = `sample-v1:${account.id}:${options.runId}:${scenario.id}`;
  let investor: { id: string };
  try {
    investor = await client.investors.create(
      { name: scenario.investorName, relationship_to_owner: "other" },
      { idempotencyKey: prefix + ":investor" },
    );
  } catch (cause) {
    throw new SampleSeedError("investor", null, { cause });
  }
  let portfolio: string | null = null;
  if (positions.length) {
    try {
      portfolio = (
        await client.portfolios.create(
          {
            name: scenario.name,
            investor: investor.id,
            as_of: scenario.asOf,
            positions,
          },
          { idempotencyKey: prefix + ":portfolio" },
        )
      ).portfolio.id;
    } catch (cause) {
      throw new SampleSeedError("portfolio", investor.id, { cause });
    }
  }
  return {
    account: account.id,
    investor: investor.id,
    portfolio,
    scenario: scenario.id,
  };
}

export interface SampleFund {
  symbol: string;
  holdings: {
    asset: string;
    category: "equity" | "debt" | "gold";
    weight: string;
  }[];
}
/** Fictional compositions for offline UI/testing only; never passed as real market records. */
export function sampleFunds(): SampleFund[] {
  return [
    {
      symbol: "synthetic:equity-a",
      holdings: [
        {
          asset: "synthetic:company-shared",
          category: "equity",
          weight: "0.6",
        },
        { asset: "synthetic:company-a", category: "equity", weight: "0.4" },
      ],
    },
    {
      symbol: "synthetic:equity-b",
      holdings: [
        {
          asset: "synthetic:company-shared",
          category: "equity",
          weight: "0.4",
        },
        { asset: "synthetic:company-b", category: "equity", weight: "0.6" },
      ],
    },
    {
      symbol: "synthetic:debt",
      holdings: [{ asset: "synthetic:bond", category: "debt", weight: "1" }],
    },
    {
      symbol: "synthetic:gold",
      holdings: [
        { asset: "synthetic:gold-asset", category: "gold", weight: "1" },
      ],
    },
  ];
}
