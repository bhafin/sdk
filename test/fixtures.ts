import assert from "node:assert/strict";
import fixtureJson from "./http-examples.json" with { type: "json" };
import type { OperationResults } from "../dist/operation-types.cjs";
import type * as M from "../dist/models.cjs";
import { valid } from "../dist/validate.cjs";
import contract from "../dist/contract.cjs";
const { operations } = contract;
import { object } from "./helpers.js";
type Requests = {
  create_investor: M.InvestorCreate;
  update_investor: M.InvestorUpdate;
  create_portfolio: M.PortfolioCreate;
  replace_snapshot: M.SnapshotCreate;
  import_history: M.HistoryImport;
};
type Request<K> = K extends "asset_mix" | "sector_mix" | "issuer_mix"
  ? Omit<M.PortfolioMixRequest, "portfolio"> & {
      portfolio: Extract<
        M.PortfolioMixRequest["portfolio"],
        { type: "in_memory" }
      >;
    }
  : K extends keyof Requests
    ? Requests[K]
    : null;
export type TypedFixture<K extends keyof OperationResults> = {
  operation_id: K;
  request: Request<K>;
  status: number;
  response: OperationResults[K];
};
export function getFixture<K extends keyof OperationResults>(
  id: K,
): TypedFixture<K> {
  const f = fixtureJson.find((x) => x.operation_id === id);
  assert.ok(f);
  assert.ok(valid(operations[id].response, f.response));
  if (operations[id].request)
    assert.ok(valid(operations[id].request, f.request));
  if (["asset_mix", "sector_mix", "issuer_mix"].includes(id))
    assert.equal(object(object(f.request).portfolio).type, "in_memory");
  // Checked against the operation's generated response/request schemas above.
  const checked: unknown = f;
  return checked as TypedFixture<K>;
}
