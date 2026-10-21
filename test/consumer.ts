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
  await c.mutualFunds.fromId("46").portfolio.assetMix();
  await c.mutualFunds.fromInstrument("ins_example").issuerMix();
  await (
    await c.mutualFunds.search({ query: "Example" })
  ).data[0].instrument.sectorMix();
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
