import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { Bharosa, TransportError } from "../dist/index.mjs";
async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server.address().port;
}
async function close(server) {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
test("native fetch never forwards credentials to redirect destination", async () => {
  let destinationCalls = 0,
    sourceCalls = 0;
  const destination = http.createServer((_req, res) => {
    destinationCalls++;
    res.end("{}");
  });
  const destPort = await listen(destination);
  const source = http.createServer((req, res) => {
    sourceCalls++;
    assert.equal(req.headers.authorization, "Bearer fictional-loopback-key");
    res.writeHead(302, { Location: `http://127.0.0.1:${destPort}/capture` });
    res.end();
  });
  try {
    const port = await listen(source);
    const sdk = new Bharosa({
      baseUrl: `http://127.0.0.1:${port}`,
      allowLocalhostHttp: true,
      account: "me",
      auth: { type: "account_key", apiKey: "fictional-loopback-key" },
    });
    await assert.rejects(sdk.accounts.retrieve(), TransportError);
    assert.equal(sourceCalls, 1);
    assert.equal(destinationCalls, 0);
  } finally {
    await close(source);
    await close(destination);
  }
});
