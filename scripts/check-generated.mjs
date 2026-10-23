import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "bharosa-generation-"));
try {
  for (const dir of ["scripts", "src", "test"])
    fs.mkdirSync(path.join(temp, dir));
  for (const file of ["scripts/generate.mjs", "test/openapi.json"])
    fs.copyFileSync(path.join(root, file), path.join(temp, file));
  const result = spawnSync(
    process.execPath,
    [path.join(temp, "scripts/generate.mjs")],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const file of ["src/contract.cjs", "src/models.cts", "CONTRACT-SHA256"])
    assert.equal(
      fs.readFileSync(path.join(root, file), "utf8"),
      fs.readFileSync(path.join(temp, file), "utf8"),
      `${file} differs from public contract generation`,
    );
  console.log("Generated schema, types, and digest match the public contract.");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
