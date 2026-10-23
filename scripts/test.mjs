import fs from "node:fs";
import { spawnSync } from "node:child_process";
const run = (args) => {
  const r = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run(["tooling/node_modules/typescript/bin/tsc", "-p", "tsconfig.test.json"]);
for (const name of fs.readdirSync("test"))
  if (name.endsWith(".json"))
    fs.copyFileSync("test/" + name, ".test-build/" + name);
const tests = fs
  .readdirSync(".test-build")
  .filter((x) => x.endsWith(".test.js"))
  .map((x) => ".test-build/" + x);
run(["--test", ...tests, "test/typescript-migration.test.mjs"]);
