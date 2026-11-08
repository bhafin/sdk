import {
  Bharosa,
  APIError,
  type InvestorCreate,
  type SnapshotView,
} from "bharosa";
const c = new Bharosa({
  baseUrl: "https://synthetic.invalid",
  account: "acct_0123456789abcdef0123456789abcdef",
  auth: { type: "account_key", apiKey: "fictional" },
});
const body: InvestorCreate = { name: "Member", relationship_to_owner: "other" };
const opts = { idempotencyKey: "test", maxRetries: 1 as const };
async function types() {
  const a = await c.accounts.retrieve({ timeoutMs: 100 });
  a.id.toUpperCase();
  await c.clients.list({ startingAfter: "clt_id" });
  await c.clients.retrieve("clt_id");
  await c.investors.list({ client: "clt_id" });
  await c.investors.retrieve("inv_id");
  await c.investors.create(body, opts);
  await c.investors.update("inv_id", { name: "New" }, opts);
  await c.portfolios.list();
  await c.portfolios.retrieve("ptf_id");
  const built = c.portfolios.build({
    valuationDate: "2026-10-18",
    positions: [{ instrument: "ins_example", current_value: "1" }],
  });
  built.positions[0].instrument.toUpperCase();
  await built.assetMix();
  c.portfolios.fromPositions({
    valuationDate: "2026-10-18",
    positions: built.positions,
  });
  // @ts-expect-error supplied positions are immutable
  built.positions[0].current_value = "2";
  // @ts-expect-error the collection is immutable
  built.positions.push({ instrument: "ins_example", current_value: "2" });
  // @ts-expect-error the positions property cannot be replaced
  built.positions = [];
  // @ts-expect-error in-memory handles have no saved snapshot method
  built.currentSnapshot();
  const saved = await c.portfolios.retrieve("ptf_id");
  const current = await saved.currentSnapshot({ timeoutMs: 1000 });
  await current.portfolio.currentSnapshot();
  await (await c.portfolios.list()).data[0].currentSnapshot();
  (
    await saved.assetMix({ asOf: "2026-10-18" })
  ).mix.items[0].percentage.toUpperCase();
  await (await c.portfolios.list()).data[0].issuerMix();
  await c.portfolios
    .fromPositions({
      valuationDate: "2026-10-18",
      positions: [{ instrument: "ins_example", current_value: "1" }],
    })
    .sectorMix({}, { maxRetries: 1 });
  await c.mutualFunds.fromId("46").assetMix();
  await c.mutualFunds.fromInstrument("ins_example").issuerMix();
  await (
    await c.mutualFunds.search({ query: "Example" })
  ).data[0].sectorMix();
  await (
    await c.mutualFunds.references({ instruments: ["ins_example"] })
  ).data[0].instrument.assetMix();
  const snap: SnapshotView = await c.portfolios.create(
    {
      name: "Portfolio",
      investor: "inv_id",
      as_of: "2026-10-18",
      positions: [
        { instrument: "ins_example", current_value: "1.000000000000000001" },
      ],
    },
    opts,
  );
  await c.portfolios.snapshots.retrieveCurrent("ptf_id");
  await c.portfolios.snapshots.create(
    "ptf_id",
    { expected_snapshot: snap.snapshot.id, as_of: "2026-10-18", positions: [] },
    opts,
  );
  await c.mutualFunds.search({ query: "Example" });
  await c.mutualFunds.references({ instruments: ["ins_example"] });
}
new Bharosa({
  baseUrl: "https://synthetic.invalid",
  account: "me",
  // @ts-expect-error Direct key cannot include delegated token.
  auth: { type: "account_key", apiKey: "fake", userAccessToken: "fake" },
});
new Bharosa({
  baseUrl: "https://synthetic.invalid",
  account: "me",
  // @ts-expect-error Delegation requires user token.
  auth: { type: "delegated_application", apiKey: "fake" },
});
const invalid: InvestorCreate = {
  name: "Member",
  // @ts-expect-error request enum is closed
  relationship_to_owner: "future_relationship",
};
// @ts-expect-error creation requires idempotency
c.investors.create(body);
// @ts-expect-error headers cannot override credentials
c.accounts.retrieve({ headers: { Authorization: "fake" } });
// @ts-expect-error resource clients are immutable
c.accounts = { retrieve: async () => ({}) };
void types;
void invalid;
void APIError;

const transported = new Bharosa({
  baseUrl: "https://synthetic.invalid",
  account: "me",
  transport: { send: async (url, request) => fetch(url, request) },
});
async function marketTypes() {
  const funds = await transported.marketData.funds.list({
    category: "Equity",
    limit: 10,
  });
  funds.data[0].manager_ids[0].toUpperCase();
  await transported.marketData.schemes.expenseRatios("11", {
    from: "2026-01-01",
    to: "2026-01-11",
  });
  const value = await transported.marketData.schemes.valuation("11", {
    units: "1.25",
    asOf: "2026-01-11",
    positionDate: "2026-01-09",
  });
  if (value.status === "available") value.nav.date.toUpperCase();
  else value.reason.toUpperCase();
  const portfolio = await transported.portfolios.retrieve("ptf_id");
  const result = await portfolio.holdings.setCurrent(
    {
      source: { kind: "user", reference: "entry" },
      holdings: [
        {
          external_id: "position",
          investment_account: "iac_id",
          instrument: "ins_example",
          observed_position: {
            date: "2026-01-11",
            current_value: { amount: "10.02", currency: "INR" },
          },
        },
      ],
    },
    { idempotencyKey: "entry" },
  );
  const derivation = result.holdings[0].derivation;
  if (derivation.kind === "amount_divided_by_nav")
    derivation.nav.amount.toUpperCase();
  // @ts-expect-error current writes require idempotency
  portfolio.holdings.setCurrent({
    source: { kind: "user", reference: "entry" },
    holdings: [],
  });
  // @ts-expect-error money/units are decimal strings
  transported.marketData.schemes.valuation("11", { units: 1.25 });
}
// @ts-expect-error custom transport cannot also carry SDK credentials
new Bharosa({
  baseUrl: "https://synthetic.invalid",
  account: "me",
  transport: { send: fetch },
  auth: { type: "account_key", apiKey: "synthetic" },
});
void marketTypes;
async function currentViewTypes(client: Bharosa, id: string) {
  const portfolio = await client.portfolios.retrieve(id);
  const result = await portfolio.current().assetMix();
  const units: string = result.current_valuation.holdings[0]!.units;
  const date: string = result.current_valuation.holdings[0]!.nav.date;
  // @ts-expect-error current view does not silently accept a historical cutoff
  await portfolio.current().assetMix({ asOf: "2026-01-01" });
  return { units, date };
}
void currentViewTypes;

import { samplePortfolios, seedSamplePortfolio } from "bharosa/testing";
async function monthlyTypes(
  client: Bharosa,
  schemeId: string,
  ownerId: string,
) {
  const nav = await client.marketSnapshots.schemes.nav(schemeId, {
    asOf: "2026-08-01",
  });
  if (nav.status === "available") {
    const amount: string = nav.data.amount;
    void amount;
  } else {
    const missing: null = nav.data;
    void missing;
  }
  const holdings = await client.marketSnapshots.funds.holdings(ownerId, {
    asOf: "2026-08-01",
    limit: 10,
  });
  if (holdings.status === "available") {
    const id: string = holdings.data.portfolio.fund_id;
    void id;
  }
  await client.marketSnapshots.schemes.valuation(schemeId, { units: "1.25" });
  const samples = samplePortfolios();
  void samples;
  // Type check that the actual SDK can be supplied; this function is never executed.
  await seedSamplePortfolio(client, {
    confirmTestAccount: "acct_test",
    runId: "types",
    scenario: "new-investor",
    instruments: {},
  });
}
void monthlyTypes;

async function resourceAlignment(
  client: Bharosa,
  ownerId: string,
  schemeId: string,
  clients: string[],
) {
  const account = await client.accounts.retrieve();
  const family: string | null | undefined = account.personal_client_id;
  void family;
  await client.portfolios.list({ client_ids: clients });
  await client.portfolios.list({ investor_ids: ["inv_" + "a".repeat(32)] });
  await client.mutualFundSchemes.navs.retrieve(schemeId, {
    asOf: "2026-08-01",
  });
  await client.mutualFundSchemes.expenseRatios.retrieve(schemeId, {
    asOf: "2026-08-01",
  });
  await client.mutualFunds.portfolios.retrieve(ownerId, { asOf: "2026-08-01" });
  await client.mutualFunds.portfolios.holdings.list(ownerId, {
    asOf: "2026-08-01",
  });
}
void resourceAlignment;

// Verify the installed package exposes the lifecycle method and required options.
async function lifecycleConsumer(client: import("bharosa").Bharosa) {
  const renamed = await client.portfolios.update(
    "ptf_0123456789abcdef0123456789abcdef",
    { name: "Family goals", expected_name: "Family" },
    { idempotencyKey: "synthetic-rename" },
  );
  await renamed.currentSnapshot();
  // @ts-expect-error Compare-and-set requires expected_name.
  await client.portfolios.update(renamed.id, { name: "Other" }, { idempotencyKey: "synthetic-2" });
  // @ts-expect-error Mutations require explicit idempotency options.
  await client.portfolios.update(renamed.id, { name: "Other", expected_name: "Family goals" });
}
void lifecycleConsumer;

// Additive return and fund-AUM candidate surface; unrelated deferred APIs stay absent.
declare const growthClient: import("bharosa").Bharosa;
void growthClient.mutualFundSchemes.performance.retrieve("11",{asOf:"2026-10-01",periods:["1y"]});
void growthClient.fundCategories.statistics.retrieve("equity",{asOf:"2026-10-01",metrics:["return"]});
const fundAumResult: Promise<FundAum> = growthClient.mutualFunds.aum.retrieve("11417", {asOf:"2026-10-01"});
void fundAumResult;
// @ts-expect-error AUM belongs to the fund, never a scheme.
void growthClient.mutualFundSchemes.aum;
// @ts-expect-error Investor monetary returns require the separate ledger release.
void growthClient.portfolios.performance;
// @ts-expect-error Category TER is not a supported metric in this slice.
void growthClient.fundCategories.statistics.retrieve("equity",{asOf:"2026-10-01",metrics:["expense_ratio"]});

// Deferred capability types must not imply a shipped API.
// @ts-expect-error Investor monetary performance is deferred.
import type { PortfolioPerformance } from "bharosa";
import type { FundAum } from "bharosa";

import { BharosaMarket } from "bharosa";
const defaultOriginAccount = new Bharosa({
  account: "acct_0123456789abcdef0123456789abcdef",
  auth: { type: "account_key", apiKey: "synthetic-key" },
});
const defaultOriginMarket = new BharosaMarket({ apiKey: "synthetic-key" });
void defaultOriginAccount; void defaultOriginMarket;

const simpleKeyClient = new Bharosa({apiKey:"synthetic"});
void simpleKeyClient;
// @ts-expect-error API key shorthand cannot mix legacy authentication
new Bharosa({apiKey:"synthetic",auth:{type:"account_key",apiKey:"other"},account:"me"});

void simpleKeyClient.markets.schemes.nav("45139",{asOf:"2026-10-01"});

void simpleKeyClient.markets.schemes.nav("45139");

void simpleKeyClient.mutualFundSchemes.navs.retrieve("45139");
void simpleKeyClient.markets.schemes.search({query:'equity',limit:5}).then(result => {
 const id: string | undefined = result.data[0]?.scheme_id;
 void id;
});
// @ts-expect-error Search does not support historical selection.
void simpleKeyClient.markets.schemes.search({query:'equity',asOf:'2026-10-01'});
// @ts-expect-error Search is bounded, not cursor paginated.
void simpleKeyClient.markets.schemes.search({query:'equity',startingAfter:'101'});

async function catalogMigration(client: Bharosa) {
  const fund = (await client.mutualFunds.search({query:"Example"})).data[0];
  const schemes = await fund.schemes({limit:1, plan:4, option:0});
  const scheme = await client.mutualFundSchemes.retrieve(schemes.data[0].id);
  const parent = await scheme.fund();
  await scheme.nav({asOf:"2026-10-01"});
  await parent?.portfolio({asOf:"2026-10-01"});
  // @ts-expect-error ordinary method has no analytics properties
  fund.portfolio.assetMix();
  // @ts-expect-error resource is not a custom thenable
  fund.then(() => {});
  // @ts-expect-error a parent cannot be overridden through listing options
  fund.schemes({fund:"9"});
}
void catalogMigration;

// Named metadata must survive FundsList's extension index signature in the installed package.
void simpleKeyClient.mutualFundSchemes.search({query:"Example"}).then(result => {
  const hasMore: boolean = result.has_more;
  const url: string = result.url;
  const object: "list" = result.object;
  const mode: string = result.market_data.mode;
  const id: string | undefined = result.data[0]?.id;
  void [hasMore, url, object, mode, id];
});
