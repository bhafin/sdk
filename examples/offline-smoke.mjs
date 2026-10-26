import assert from "node:assert/strict";
import { Bharosa } from "bharosa";
import { samplePortfolios } from "bharosa/testing";

const account = "acct_0123456789abcdef0123456789abcdef";
let requests = 0;
const client = new Bharosa({
  baseUrl: "https://synthetic.invalid",
  account,
  transport: {
    async send(url, request) {
      assert.equal(url, `https://synthetic.invalid/v1/accounts/${account}`);
      assert.equal(request.method, "GET");
      assert.equal(new Headers(request.headers).has("Authorization"), false);
      requests++;
      return Response.json({
        id: account,
        object: "account",
        created: 1792281600,
        name: "Synthetic account",
        primary_investor: "inv_11111111111111111111111111111111",
      });
    },
  },
});
assert.equal((await client.accounts.retrieve()).id, account);
assert.equal(requests, 1);
assert.equal(samplePortfolios().length, 4);
console.log(
  "Installed SDK synthetic smoke passed. No network or persisted writes.",
);
