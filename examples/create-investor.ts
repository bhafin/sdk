import type { Bharosa } from "bharosa";

// Keep this key with the user's save operation and reuse it if the response is lost.
export async function createSyntheticInvestor(
  client: Bharosa,
  idempotencyKey: string,
) {
  return client.investors.create(
    { name: "Synthetic SDK Example Member", relationship_to_owner: "other" },
    { idempotencyKey, maxRetries: 1 },
  );
}
