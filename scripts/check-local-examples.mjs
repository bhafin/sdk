import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const compiler =
  process.env.BHAROSA_TSC ??
  path.join(root, "tooling/node_modules/typescript/bin/tsc");
assert.ok(
  fs.existsSync(compiler),
  "Install contributor tooling or set BHAROSA_TSC.",
);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "bharosa-examples-"));
try {
  fs.writeFileSync(
    path.join(temp, "package.json"),
    '{"type":"module","private":true}',
  );
  const installed = path.join(temp, "node_modules/bharosa");
  fs.mkdirSync(installed, { recursive: true });
  fs.copyFileSync(
    path.join(root, "package.json"),
    path.join(installed, "package.json"),
  );
  fs.cpSync(path.join(root, "dist"), path.join(installed, "dist"), {
    recursive: true,
  });
  const source = path.join(temp, "examples");
  fs.cpSync(path.join(root, "examples"), source, { recursive: true });
  const examples = fs
    .readdirSync(source)
    .filter((name) => name.endsWith(".ts"));
  const result = spawnSync(
    process.execPath,
    [
      compiler,
      "--strict",
      "--target",
      "ES2022",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "--outDir",
      path.join(temp, "build"),
      ...examples.map((name) => path.join(source, name)),
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const { Bharosa } = await import(
    pathToFileURL(path.join(installed, "dist/index.mjs"))
  );
  const fixtures = JSON.parse(
    fs.readFileSync(path.join(root, "test/http-examples.json"), "utf8"),
  );
  const spec = JSON.parse(
    fs.readFileSync(path.join(root, "test/openapi.json"), "utf8"),
  );
  const operations = Object.entries(spec.paths).flatMap(([route, methods]) =>
    Object.entries(methods).map(([method, operation]) => ({
      route,
      method: method.toUpperCase(),
      id: operation.operationId,
    })),
  );
  operations.push({route: "/v1/market-data/schemes/search", method: "GET", id: "baseline_search"});
  // Literal routes must win over parameter routes (asset_mix vs {portfolio}).
  operations.sort((a, b) =>
    (a.route.match(/\{/g)?.length ?? 0) - (b.route.match(/\{/g)?.length ?? 0),
  );
  operations.push({route: "/v1/market-data/schemes/{schemeId}/navs", method: "GET", id: "baseline_nav"});
  const account = "acct_0123456789abcdef0123456789abcdef";
  const portfolioId = "ptf_0123456789abcdef0123456789abcdef";
  let expectations = [];
  let calls = 0;
  let fetchAssertion;
  const client = new Bharosa({
    baseUrl: "https://synthetic.invalid",
    account,
    auth: { type: "account_key", apiKey: "synthetic-example-key" },
    fetch: async (url, init) => {
      try {
        const expected = expectations.shift();
        assert.ok(expected, "Unexpected request");
        const parsed = new URL(url);
        assert.equal(parsed.origin, "https://synthetic.invalid");
        assert.ok(
          /^\/v1\/market-data\/schemes\/(?:search|(?:45139|101)\/navs)$/.test(parsed.pathname) ||
          parsed.pathname === `/v1/accounts/${account}` ||
            parsed.pathname.startsWith(`/v1/accounts/${account}/`),
        );
        assert.equal(init.headers.Authorization, "Bearer synthetic-example-key");
        assert.equal(init.redirect, "error");
        const operation = operations.find(
          (op) =>
            op.method === init.method &&
            new RegExp(
              "^" + op.route.replace(/\{[^}]+\}/g, "[^/]+") + "$",
              "u",
            ).test(parsed.pathname),
        );
        assert.equal(operation?.id, expected.id);
        const body = init.body ? JSON.parse(init.body) : undefined;
        if (expected.body) assert.deepEqual(body, expected.body);
        if (expected.query) assert.equal(parsed.search, expected.query);
        if (expected.key)
          assert.equal(init.headers["Idempotency-Key"], expected.key);
        if (operation.id === "baseline_search") {
          calls++;
          const contract = JSON.parse(fs.readFileSync(path.join(root, "test/market-search.openapi.json"), "utf8"));
          return Response.json(contract.paths["/v1/market-data/schemes/search"].get.responses["200"].content["application/json"].example);
        }
        if (operation.id === "baseline_nav") {
          calls++;
          return Response.json({object: "market_snapshot", requested_date: "2026-10-31", observation_date: null, status: "missing", data: null});
        }
        const fixture = fixtures.find(
          (item) => item.operation_id === operation.id,
        );
        assert.ok(fixture);
        const response = structuredClone(expected.response ?? fixture.response);
        if (operation.id.endsWith("_mix")) {
          response.portfolio =
            body.portfolio.type === "saved" ? body.portfolio.id : null;
          if (body.as_of) response.as_of_date = body.as_of;
        }
        calls++;
        return new Response(JSON.stringify(response), {
          status: fixture.status,
          headers: {
            "Content-Type": "application/json",
            "Request-Id": "req_synthetic_example",
          },
        });
      } catch (error) {
        fetchAssertion = error;
        throw error;
      }
    },
  });
  async function run(expected, invoke) {
    expectations = expected;
    fetchAssertion = undefined;
    let value;
    try {
      value = await invoke();
    } catch (error) {
      // SDK transport wrapping must not hide a failed synthetic assertion.
      throw fetchAssertion ?? error;
    }
    assert.equal(expectations.length, 0, "Missing expected requests");
    return value;
  }
  const read = await import(
    pathToFileURL(path.join(temp, "build/read-account.js"))
  );
  assert.equal(
    (await run([{ id: "retrieve_account" }], () => read.readAccount(client)))
      .id,
    account,
  );
  await run(
    [
      {
        id: "list_investors",
        query: "?limit=10&starting_after=inv_00000000000000000000000000000000",
      },
    ],
    () => read.nextInvestorPage(client, "inv_00000000000000000000000000000000"),
  );
  const mixes = await import(
    pathToFileURL(path.join(temp, "build/portfolio-mixes.js"))
  );
  const saved = { type: "saved", id: portfolioId };
  const savedResult = await run(
    [
      { id: "retrieve_portfolio" },
      { id: "current_snapshot" },
      { id: "asset_mix", body: { portfolio: saved, as_of: "2026-10-01" } },
      { id: "sector_mix", body: { portfolio: saved, as_of: "2026-10-01" } },
      { id: "issuer_mix", body: { portfolio: saved, as_of: "2026-10-01" } },
    ],
    () => mixes.savedMixes(client, portfolioId),
  );
  assert.equal(savedResult.asset.mix_type, "asset");
  await run(
    [
      {
        id: "asset_mix",
        body: {
          portfolio: {
            type: "in_memory",
            valuation_date: "2026-10-17",
            currency: "INR",
            positions: [
              {
                instrument: "ins_example_india_equity_direct_growth",
                current_value: "100",
              },
            ],
          },
        },
      },
    ],
    () => mixes.inMemoryMix(client, "ins_example_india_equity_direct_growth"),
  );
  const fund = {
    type: "fund_instrument",
    instrument: "ins_example_india_equity_direct_growth",
  };
  await run(
    ["asset", "sector", "issuer"].map((kind) => ({
      id: `${kind}_mix`,
      body: { portfolio: fund },
    })),
    () => mixes.fundMixes(client, "ins_example_india_equity_direct_growth"),
  );
  const mutation = await import(
    pathToFileURL(path.join(temp, "build/create-investor.js"))
  );
  await run(
    [
      {
        id: "create_investor",
        key: "synthetic-operation-1",
        body: {
          name: "Synthetic SDK Example Member",
          relationship_to_owner: "other",
        },
      },
    ],
    () => mutation.createSyntheticInvestor(client, "synthetic-operation-1"),
  );
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  const snippets = [...readme.matchAll(/```ts\n([\s\S]*?)```/g)].map(
    (m) => m[1],
  );
  assert.equal(
    snippets.length,
    4,
    "Review README example coverage when snippets change",
  );
  const readmeSource = `declare const process: { env: Record<string, string | undefined> };\n${snippets[0]}\n${snippets
    .slice(1)
    .map(
      (s, i) =>
        `{\n${s}\n${i === 0 ? `await savedPortfolioMix(${JSON.stringify(portfolioId)});` : ""}\n}`,
    )
    .join("\n")}`;
  fs.writeFileSync(path.join(temp, "readme.ts"), readmeSource);
  const readmeCompile = spawnSync(
    process.execPath,
    [
      compiler,
      "--strict",
      "--target",
      "ES2022",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      path.join(temp, "readme.ts"),
    ],
    { encoding: "utf8" },
  );
  assert.equal(
    readmeCompile.status,
    0,
    readmeCompile.stdout + readmeCompile.stderr,
  );
  const readmeJs = fs
    .readFileSync(path.join(temp, "readme.js"), "utf8")
    .replace('import { Bharosa } from "bharosa";', "");
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  class ExampleClient {
    constructor(config) {
      assert.deepEqual(config, {apiKey: "synthetic-example-key"});
      return client;
    }
  }
  const exampleProcess = {
    env: {
      BHAROSA_API_BASE_URL: "https://synthetic.invalid",
      BHAROSA_ACCOUNT_ID: account,
      BHAROSA_SECRET_KEY: "synthetic-example-key",
    },
  };
  await run(
    [
      { id: "baseline_nav" },
      { id: "retrieve_portfolio" },
      { id: "current_snapshot" },
      { id: "asset_mix", body: { portfolio: saved } },
      { id: "search_funds" },
      { id: "baseline_search", query: "?query=equity&limit=5" },
      { id: "baseline_nav" },
    ],
    () =>
      new AsyncFunction("Bharosa", "process", readmeJs)(
        ExampleClient,
        exampleProcess,
      ),
  );
  const gettingStarted = fs.readFileSync(
    path.join(root, "docs/getting-started.md"),
    "utf8",
  );
  const setupSnippet = gettingStarted
    .match(/```js\n([\s\S]*?)```/)[1]
    .replace('import { Bharosa } from "bharosa";', "");
  await run([{ id: "retrieve_account" }], () =>
    new AsyncFunction("Bharosa", "process", "console", setupSnippet)(
      ExampleClient,
      exampleProcess,
      {
        log(value) {
          assert.equal(value, account);
        },
      },
    ),
  );
  await run(
    [
      {
        id: "list_clients",
        response: {
          ...fixtures.find((f) => f.operation_id === "list_clients").response,
          data: [
            {
              ...fixtures.find((f) => f.operation_id === "list_clients")
                .response.data[0],
              id: "clt_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            },
          ],
          has_more: true,
        },
      },
      {
        id: "list_clients",
        query: "?limit=100&starting_after=clt_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
      { id: "list_investors" },
      { id: "list_portfolios" },
      { id: "current_snapshot" },
      { id: "asset_mix", body: { portfolio: saved } },
    ],
    () =>
      mixes.selectedSavedMix(client, async (_kind, choices) => {
        assert.ok(choices.length);
        return choices.at(-1).id;
      }),
  );
  await assert.rejects(
    () =>
      run([{ id: "list_clients" }], () =>
        mixes.selectedSavedMix(client, async () => "not-a-returned-id"),
      ),
    /Choose a family/,
  );
  assert.equal(calls, 27);
  console.log(
    `Compiled ${examples.length} example files and ${snippets.length} README snippets; verified ${calls} synthetic requests including setup; no live API used.`,
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
