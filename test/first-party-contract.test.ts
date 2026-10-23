import { object } from "./helpers.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
test("first-party transport descriptors and digest match the standalone OpenAPI snapshot", () => {
  const r = spawnSync(
    process.execPath,
    ["scripts/generate-first-party.mjs", "--check"],
    { cwd: new URL("..", import.meta.url), encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const spec: unknown = JSON.parse(
    fs.readFileSync(
      new URL("./first-party.openapi.json", import.meta.url),
      "utf8",
    ),
  );
  const paths = object(object(spec).paths);
  for (const item of Object.values(paths))
    for (const operation of Object.values(object(item))) {
      assert.equal(object(operation)["x-availability"], "first_party_session");
      assert.deepEqual(object(operation).security, [{ browserSession: [] }]);
    }
});
