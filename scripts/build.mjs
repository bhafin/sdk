import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url),
  dist = new URL("dist/", root);
fs.rmSync(dist, { recursive: true, force: true });
const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL("tooling/node_modules/typescript/bin/tsc", root)),
    "--project",
    fileURLToPath(new URL("tsconfig.json", root)),
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
for (const name of [
  "monthly-market-data.cjs",
  "monthly-market-data.d.cts",
  "contract.cjs",
  "market-data.cjs",
  "contract.d.cts",
  "market-data.d.cts",
])
  fs.copyFileSync(new URL("src/" + name, root), new URL(name, dist));
for (const name of fs.readdirSync(dist))
  if (name.endsWith(".d.cts"))
    fs.writeFileSync(
      new URL(name.replace(".d.cts", ".d.ts"), dist),
      fs
        .readFileSync(new URL(name, dist), "utf8")
        .replaceAll('.cjs"', '.js"')
        .replaceAll(".cjs'", ".js'"),
    );
