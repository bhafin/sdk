import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
const marketing =
  process.env.BHAROSA_MARKETING_ROOT ?? path.resolve("../marketing");
const consumer = process.env.BHAROSA_CONSUMER_ROOT;
if (!consumer)
  throw Error(
    "Set BHAROSA_CONSUMER_ROOT to an isolated installed tarball consumer.",
  );
// Regenerate only files owned by this checker; stale guide files must not
// participate when switching reviewed documentation snapshots.
for (const name of fs.readdirSync(consumer)) {
  if (/^website-.*\.(ts|mjs)$/.test(name)) fs.rmSync(path.join(consumer,name));
}
const { endpoints } = await import(
  pathToFileURL(path.join(marketing, "src/content/product.ts"))
);
const { requestExamples } = await import(
  pathToFileURL(path.join(marketing, "src/content/examples.ts"))
);
const { Bharosa } = await import(
  pathToFileURL(path.join(consumer, "node_modules/bharosa/dist/index.mjs"))
);
const testing = await import(
  pathToFileURL(path.join(consumer, "node_modules/bharosa/dist/testing.cjs"))
);
const env = {
  BHAROSA_SECRET_KEY: "synthetic-secret",
  BHAROSA_APPLICATION_KEY: "synthetic-app-key",
  BHAROSA_USER_ACCESS_TOKEN: "synthetic-token",
  BHAROSA_ACCOUNT_ID: "acct_0123456789abcdef0123456789abcdef",
  BHAROSA_API_BASE_URL: "https://synthetic.invalid",
};
if (!process.env.BHAROSA_TSC)
  throw Error("Set BHAROSA_TSC to compile and execute TypeScript examples.");
const ts = (
  await import(
    pathToFileURL(
      path.resolve(process.env.BHAROSA_TSC, "../../lib/typescript.js"),
    )
  )
).default;

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
let count = 0;
for (const e of endpoints)
  for (const delegated of [false, true]) {
    let calls = 0;
    class SyntheticClient extends Bharosa {
      constructor(config) {
        super({
          ...config,
          fetch: async (url, init) => {
            calls++;
            const prerequisite = endpoints.find(
              (x) =>
                x.method === init.method &&
                new RegExp(
                  "^" + x.path.replace(/\{[^}]+\}/g, "[^/]+") + "$",
                ).test(new URL(url).pathname),
            );
            if (
              e.group === "Holding history" &&
              prerequisite &&
              prerequisite.slug !== e.slug
            )
              return new Response(JSON.stringify(prerequisite.response), {
                status: 200,
                headers: {
                  "Content-Type": "application/json",
                  "Request-Id": "req_prerequisite",
                },
              });

            assert.equal(
              init.headers["Bharosa-User-Authorization"],
              delegated ? "Bearer synthetic-token" : undefined,
            );
            return new Response(JSON.stringify(e.response), {
              status: e.status,
              headers: {
                "Content-Type": "application/json",
                "Request-Id": "req_example",
              },
            });
          },
        });
      }
    }
    const { sdk } = requestExamples(e, delegated);
    const js = ts.transpileModule(
      sdk.replace('import { Bharosa } from "bharosa";', ""),
      {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText;
    await new AsyncFunction("Bharosa", "process", "crypto", js)(
      SyntheticClient,
      { env },
      { randomUUID: () => "synthetic-example-key" },
    );
    assert.equal(
      calls,
      e.slug === "holding-position" ? 3 : e.group === "Holding history" ? 2 : 1,
    );
    count++;
    fs.writeFileSync(
      path.join(consumer, `website-${e.slug}-${delegated}.ts`),
      `declare const process: {env: Record<string,string|undefined>};\n` + sdk,
    );
  }
console.log(
  `Executed ${count} unchanged website snippets against the packed SDK with synthetic transport.`,
);
if (process.env.BHAROSA_TSC) {
  const productUrl = pathToFileURL(
    path.join(marketing, "src/content/product.ts"),
  ).href;
  // A data URL has no relative base; resolve all guide imports explicitly.
  const guideSource = fs
    .readFileSync(path.join(marketing, "src/content/guides.ts"), "utf8")
    .replace(/from\s+["'](\.\/[^"']+)["']/g, (_match, specifier) => {
      const filename = /\.[a-z]+$/i.test(specifier)
        ? specifier
        : specifier + ".ts";
      return (
        "from " +
        JSON.stringify(
          pathToFileURL(path.resolve(marketing, "src/content", filename)).href,
        )
      );
    });
  const guideJs = ts.transpileModule(guideSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const { guides } = await import(
    "data:text/javascript;base64," + Buffer.from(guideJs).toString("base64")
  );
  const { sdkInitialization } = await import(productUrl);
  let guideCount = 0;
  for (const guide of guides)
    for (const section of guide.sections) {
      if (
        !section.code ||
        !/\bBharosa\b|\bbharosa\s*\.|from\s*["']bharosa(?:\/testing)?["']/.test(
          section.code,
        )
      )
        continue;
      // Installation commands and MCP host JSON are not SDK TypeScript examples.
      // Shell examples remain owned by the website tooling.
      if (
        /^(?:\s*#[^\n]*(?:\n|$))*\s*(?:curl|npm|npx|node|claude|codex)\b/.test(
          section.code,
        )
      )
        continue;
      const javascript = section.codeLanguage === "javascript";
      const source = javascript
        ? section.code
        : (/import\s*\{[^}]*\bBharosa\b|\bnew\s+Bharosa\s*\(/.test(section.code)
            ? ""
            : sdkInitialization + "\n") + section.code;
      // This contextual consent snippet explicitly consumes a previously validated
      // delivery. Supply synthetic setup; do not skip or modify the snippet.
      const context =
        guide.slug === "connect-an-account" && section.id === "step-3"
          ? `const delivery = {account_id: "${env.BHAROSA_ACCOUNT_ID}", access_token: "${env.BHAROSA_USER_ACCESS_TOKEN}"}; const applicationKey = "${env.BHAROSA_APPLICATION_KEY}";\n`
          : "";
      const executable =
        context +
        source +
        (guide.slug === "oauth"
          ? "\nawait retrieveGrantedAccount({accountId:process.env.BHAROSA_ACCOUNT_ID!,accessToken:process.env.BHAROSA_USER_ACCESS_TOKEN!});"
          : "");
      class GuideClient extends Bharosa {
        constructor(config) {
          super({
            ...config,
            fetch: async (url, init) => {
              const pathname = new URL(url).pathname;
              const endpoint = endpoints.find(
                (e) =>
                  e.method === init.method &&
                  new RegExp(
                    "^" + e.path.replace(/\{[^}]+\}/g, "[^/]+") + "$",
                  ).test(pathname),
              );
              assert.ok(endpoint);
              return new Response(JSON.stringify(endpoint.response), {
                status: endpoint.status,
                headers: {
                  "Content-Type": "application/json",
                  "Request-Id": "req_guide",
                },
              });
            },
          });
        }
      }
      const js = ts
        .transpileModule(
          executable
            .replace(
              /import\s*\{([^}]+)\}\s*from\s*["']node:crypto["'];?/g,
              'const {$1} = await import("node:crypto");',
            )
            .replace('import { Bharosa } from "bharosa";', "")
            .replace(
              /import\s*\{([^}]+)\}\s*from\s*["']bharosa\/testing["'];?/g,
              "const {$1} = testing;",
            ),
          {
            compilerOptions: {
              module: ts.ModuleKind.ESNext,
              target: ts.ScriptTarget.ES2022,
            },
          },
        )
        .outputText.replace(
          /^export\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/gm,
          "",
        )
        .replace(/^export\s*\{\s*\};?$/gm, "");
      await new AsyncFunction(
        "Bharosa",
        "process",
        "crypto",
        "console",
        "testing",
        js,
      )(
        GuideClient,
        { env },
        { randomUUID: () => "synthetic-guide-key" },
        { log() {} },
        testing,
      );
      const stem = `website-guide-${guide.slug}-${section.id}`;
      fs.rmSync(path.join(consumer, stem + (javascript ? ".ts" : ".mjs")), {
        force: true,
      });
      fs.writeFileSync(
        path.join(consumer, stem + (javascript ? ".mjs" : ".ts")),
        javascript
          ? source
          : `declare const process: {env: Record<string,string|undefined>};\n` +
              (source.includes("import { Bharosa }")
                ? ""
                : 'import { Bharosa } from "bharosa";\n') +
              context +
              source,
      );
      guideCount++;
    }
  console.log(
    `Executed ${guideCount} SDK guide snippets, supplying documented initialization for contextual snippets.`,
  );

  const files = fs
    .readdirSync(consumer)
    .filter((x) => x.startsWith("website-") && /\.(ts|mjs)$/.test(x));
  const r = spawnSync(
    process.execPath,
    [
      process.env.BHAROSA_TSC,
      "--noEmit",
      "--typeRoots",
      path.resolve(path.dirname(process.env.BHAROSA_TSC), "../../@types"),
      "--strict",
      "--allowJs",
      "--checkJs",
      "--target",
      "ES2022",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      ...files,
    ],
    { cwd: consumer, encoding: "utf8" },
  );
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  process.exitCode = r.status;
}
