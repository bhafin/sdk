import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("../tooling/node_modules/typescript");
const source = readFileSync(
  new URL("../examples/portfolio-mixes.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { selectedSavedMix } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
for (const [name, pages, reject] of [
  ["healthy pages", [["a"], ["b"]], false],
  ["two-page cycle", [["a"], ["b"], ["a"]], true],
  [
    "overlapping pages",
    [
      ["a", "b"],
      ["b", "c"],
    ],
    true,
  ],
  ["repeated cursor", [["a"], ["a"]], true],
  ["empty continuing page", [[]], true],
] as const)
  test(`saved portfolio example pagination: ${name}`, async () => {
    let calls = 0;
    const client = {
      clients: {
        list: async () => {
          const ids = pages[calls++];
          if (!ids) throw Error("Unexpected unbounded pagination");
          return {
            data: ids.map((id) => ({ id })),
            has_more: reject || calls < pages.length,
          };
        },
      },
      investors: {
        list: async () => ({ data: [{ id: "i" }], has_more: false }),
      },
      portfolios: {
        list: async () => ({
          data: [
            {
              id: "p",
              investor: "i",
              currentSnapshot: async () => ({ synthetic: true }),
              assetMix: async () => ({ synthetic: true }),
            },
          ],
          has_more: false,
        }),
      },
    };
    const action = () =>
      selectedSavedMix(
        client,
        async (_kind: string, rows: { id: string }[]) => rows[0]!.id,
      );
    if (reject)
      await assert.rejects(
        action,
        /repeated records|list could not be completed/,
      );
    else
      assert.deepEqual(await action(), {
        snapshot: { synthetic: true },
        asset: { synthetic: true },
      });
    assert.ok(calls <= pages.length);
  });
