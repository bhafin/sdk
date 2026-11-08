import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "bharosa-consumer-"));
const env = {
  ...process.env,
  PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH,
  npm_config_cache: path.join(temp, "cache"),
};
function run(cmd, args, cwd = temp) {
  const r = spawnSync(cmd, args, { cwd, env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return r.stdout;
}
const dry = JSON.parse(run("npm", ["pack", "--dry-run", "--json"], root))[0];
assert.ok(dry.files.some((x) => x.path === "LICENSE"));
for (const f of dry.files)
  assert.match(
    f.path,
    /^(dist\/[^/]+\.(?:cjs|mjs|d\.ts|d\.cts|d\.mts)|README\.md|CONTRIBUTING\.md|SECURITY\.md|CHANGELOG\.md|docs\/(?:index|getting-started|portfolios|reliability|releasing|provenance|testing|analytics|fund-aum|benchmarks|monthly-market-data)\.md|examples\/(?:README\.md|(?:read-account|portfolio-mixes|create-investor|benchmark-performance)\.ts|offline-smoke\.mjs)|LICENSE|CONTRACT-SHA256|FIRST-PARTY-CONTRACT-SHA256|ANALYTICS-CONTRACT-SHA256|MARKET-SEARCH-CONTRACT-SHA256|BENCHMARK-CONTRACT-SHA256|MONTHLY-MARKET-CONTRACT-SHA256|package\.json)$/,
  );
assert.ok(
  !dry.files.some(
    (x) =>
      !new Set([
        "dist/testing.cjs",
        "dist/testing.d.cts",
        "dist/testing.d.ts",
        "docs/testing.md",
      ]).has(x.path) &&
      /(test|fixture|\.env|source.?map|AGENTS|HANDOFF)/i.test(x.path),
  ),
);
const packed = JSON.parse(
  run("npm", ["pack", "--json", "--pack-destination", temp], root),
)[0];
fs.writeFileSync(
  path.join(temp, "package.json"),
  JSON.stringify({ name: "synthetic-consumer", private: true, type: "module" }),
);
run("npm", [
  "install",
  "--ignore-scripts",
  "--no-audit",
  "--no-fund",
  path.join(temp, packed.filename),
]);
for (const [name, source] of [
  [
    "esm.mjs",
    "import {Bharosa,ValidationError} from 'bharosa'; if(typeof Bharosa !== 'function'||typeof ValidationError !== 'function')throw Error('export');",
  ],
  [
    "testing.cjs",
    "const t=require('bharosa/testing'); if(t.samplePortfolios().length!==4)throw Error('samples'); if('samplePortfolios' in require('bharosa'))throw Error('testing leaked into main');",
  ],
  [
    "testing.mjs",
    "import {sampleFunds} from 'bharosa/testing'; if(sampleFunds().length!==4)throw Error('sample funds');",
  ],
  [
    "cjs.cjs",
    "const {Bharosa}=require('bharosa'); if(typeof Bharosa !== 'function')throw Error('export');",
  ],
]) {
  fs.writeFileSync(path.join(temp, name), source);
  run(process.execPath, [name]);
}
for (const entry of ["cjs.cjs", "esm.mjs"]) {
  const browser = spawnSync(process.execPath, ["--conditions=browser", entry], {
    cwd: temp,
    env,
    encoding: "utf8",
  });
  assert.equal(browser.status, 0, browser.stderr);
}
run(process.execPath, ["node_modules/bharosa/examples/offline-smoke.mjs"]);
const deep = spawnSync(
  process.execPath,
  ["-e", "require('bharosa/dist/index.cjs')"],
  { cwd: temp, env, encoding: "utf8" },
);
assert.notEqual(deep.status, 0);
assert.match(deep.stderr, /ERR_PACKAGE_PATH_NOT_EXPORTED/);
process.env.BHAROSA_TSC ??= path.join(
  root,
  "tooling/node_modules/typescript/bin/tsc",
);
const source = fs.readFileSync(path.join(root, "test/consumer.ts"), "utf8");
for (const ext of ["mts", "cts", "ts"])
  fs.writeFileSync(path.join(temp, "consumer." + ext), source);
for (const [module, resolution, files] of [
  ["NodeNext", "NodeNext", ["consumer.mts", "consumer.cts"]],
  ["Node16", "Node16", ["consumer.mts", "consumer.cts"]],
  ["ESNext", "Bundler", ["consumer.ts"]],
])
  run(process.execPath, [
    process.env.BHAROSA_TSC,
    "--noEmit",
    "--strict",
    "--target",
    "ES2022",
    "--module",
    module,
    "--moduleResolution",
    resolution,
    ...files,
  ]);
const packageJson = JSON.parse(
  fs.readFileSync(path.join(temp, "node_modules/bharosa/package.json")),
);
assert.equal(packageJson.private, undefined); // Authorized public v0.10 release.
assert.equal(packageJson.scripts.prepublishOnly, undefined);
assert.equal(
  packageJson.version,
  JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version,
);
assert.equal(packageJson.publishConfig.registry, "https://registry.npmjs.org/");
assert.equal(packageJson.license, "MIT");
assert.match(
  fs.readFileSync(path.join(temp, "node_modules/bharosa/LICENSE"), "utf8"),
  /Copyright \(c\) 2026 Bharosa Technoserve Private Limited/,
);

console.log(
  JSON.stringify(
    {
      node: process.versions.node,
      typescript: run(process.execPath, [
        process.env.BHAROSA_TSC,
        "--version",
      ]).trim(),
      files: packed.files.map((x) => x.path),
      tarball: path.join(temp, packed.filename),
      consumer: temp,
      verified: [
        "ESM",
        "CJS",
        "NodeNext",
        "Node16",
        "Bundler",
        "browser ESM and CJS exports",
        "deep-import rejection",
        "allowlist",
        "release license/publication metadata checks",
      ],
    },
    null,
    2,
  ),
);
