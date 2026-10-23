import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
const root = new URL("../", import.meta.url);
test("authored runtime is strict TypeScript with compiler-emitted declarations", () => {
  for (const name of ["index.cts", "validate.cts"])
    assert.ok(
      existsSync(new URL("src/" + name, root)),
      `${name} must be authored TypeScript`,
    );
  const config = JSON.parse(
    readFileSync(new URL("tsconfig.json", root), "utf8"),
  );
  assert.equal(config.compilerOptions.strict, true);
  assert.equal(config.compilerOptions.declaration, true);
  assert.equal(config.compilerOptions.noEmitOnError, true);
  assert.equal(
    existsSync(new URL("src/index.d.ts", root)),
    false,
    "public client declarations must be emitted from implementation",
  );
});
test("behavioral suites are TypeScript and included in required checks", () => {
  for (const name of ["sdk", "http", "browser-session", "first-party-contract"])
    assert.ok(
      existsSync(new URL(`test/${name}.test.ts`, root)),
      `${name} suite must be typechecked`,
    );
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  assert.match(pkg.scripts.test, /typecheck/);
});
