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
const { endpoints } = await import(
  pathToFileURL(path.join(marketing, "src/content/product.ts"))
);
const { requestExamples } = await import(
  pathToFileURL(path.join(marketing, "src/content/examples.ts"))
);
const { Bharosa } = await import(
  pathToFileURL(path.join(consumer, "node_modules/bharosa/dist/index.mjs"))
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
  const guideSource = fs
    .readFileSync(path.join(marketing, "src/content/guides.ts"), "utf8")
    .replace('"./product"', JSON.stringify(productUrl))
    .replace(
      '"./examples"',
      JSON.stringify(
        pathToFileURL(path.join(marketing, "src/content/examples.ts")).href,
      ),
    );
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
      if (!section.code || !/bharosa|Bharosa/.test(section.code)) continue;
      // Shell examples are checked by the website tooling, not the TS executor.
      if (/^\s*curl\b/.test(section.code)) continue;
      const source =
        (section.code.includes("import { Bharosa }")
          ? ""
          : sdkInitialization + "\n") + section.code;
      const executable =
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
      const js = ts.transpileModule(
        executable.replace('import { Bharosa } from "bharosa";', ""),
        {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        },
      ).outputText;
      await new AsyncFunction("Bharosa", "process", "crypto", "console", js)(
        GuideClient,
        { env },
        { randomUUID: () => "synthetic-guide-key" },
        { log() {} },
      );
      fs.writeFileSync(
        path.join(consumer, `website-guide-${guide.slug}-${section.id}.ts`),
        `declare const process: {env: Record<string,string|undefined>};\n` +
          source,
      );
      guideCount++;
    }
  console.log(
    `Executed ${guideCount} SDK guide snippets, supplying documented initialization for contextual snippets.`,
  );

  const files = fs
    .readdirSync(consumer)
    .filter((x) => x.startsWith("website-") && x.endsWith(".ts"));
  const r = spawnSync(
    process.execPath,
    [
      process.env.BHAROSA_TSC,
      "--noEmit",
      "--strict",
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
