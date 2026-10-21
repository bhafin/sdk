import type { Bharosa, InvestorCreate } from "bharosa";

export async function createSyntheticInvestor(
  client: Bharosa,
  idempotencyKey: string,
) {
  const body: InvestorCreate = {
    name: "Synthetic SDK Example Member",
    relationship_to_owner: "other",
  };
  return client.investors.create(body, { idempotencyKey, maxRetries: 1 });
}
