import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const compiler =
  process.env.BHAROSA_TSC ??
  fileURLToPath(
    new URL("../tooling/node_modules/typescript/bin/tsc", import.meta.url),
  );
const result = spawnSync(process.execPath, ["scripts/pack-smoke.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, BHAROSA_TSC: compiler },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
