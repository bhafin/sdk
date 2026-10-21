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
    /^(dist\/[^/]+\.(?:cjs|mjs|d\.ts|d\.cts)|README\.md|CONTRIBUTING\.md|SECURITY\.md|CHANGELOG\.md|docs\/(?:index|getting-started|portfolios|reliability|releasing|provenance)\.md|examples\/(?:README\.md|(?:read-account|portfolio-mixes|create-investor)\.ts)|LICENSE|CONTRACT-SHA256|package\.json)$/,
  );
assert.ok(
  !dry.files.some((x) =>
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
    "import {Bharosa} from 'bharosa'; if(typeof Bharosa !== 'function')throw Error('export');",
  ],
  [
    "cjs.cjs",
    "const {Bharosa}=require('bharosa'); if(typeof Bharosa !== 'function')throw Error('export');",
  ],
]) {
  fs.writeFileSync(path.join(temp, name), source);
  run(process.execPath, [name]);
}
const browser = spawnSync(
  process.execPath,
  ["--conditions=browser", "cjs.cjs"],
  { cwd: temp, env, encoding: "utf8" },
);
assert.notEqual(browser.status, 0);
assert.match(browser.stderr, /server-only/);
const deep = spawnSync(
  process.execPath,
  ["-e", "require('bharosa/dist/index.cjs')"],
  { cwd: temp, env, encoding: "utf8" },
);
assert.notEqual(deep.status, 0);
assert.match(deep.stderr, /ERR_PACKAGE_PATH_NOT_EXPORTED/);
if (!process.env.BHAROSA_TSC)
  throw Error("Set BHAROSA_TSC to the TypeScript compiler entry path.");
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
assert.equal(packageJson.private, true);
assert.equal(packageJson.license, "MIT");
assert.match(
  fs.readFileSync(path.join(temp, "node_modules/bharosa/LICENSE"), "utf8"),
  /Copyright \(c\) 2026 Bharosa Technoserve Private Limited/,
);
assert.ok(packageJson.scripts.prepublishOnly);
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
        "browser rejection",
        "deep-import rejection",
        "allowlist",
        "private license/publication gates",
      ],
    },
    null,
    2,
  ),
);
