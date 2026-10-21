import type { Bharosa } from "bharosa";

export async function readAccount(client: Bharosa) {
  return client.accounts.retrieve();
}

export async function nextInvestorPage(
  client: Bharosa,
  lastInvestorId: string,
) {
  return client.investors.list({ limit: 10, startingAfter: lastInvestorId });
}
