import fs from "node:fs";
import { createHash } from "node:crypto";
const raw = fs.readFileSync(
  new URL("../test/first-party.openapi.json", import.meta.url),
);
const doc = JSON.parse(raw);
const operations = {};
for (const [path, item] of Object.entries(doc.paths))
  for (const [method, op] of Object.entries(item)) {
    const status = Object.keys(op.responses).find((s) => /^2\d\d$/.test(s));
    operations[op.operationId] = {
      path,
      method: method.toUpperCase(),
      status: Number(status),
      marketData: true,
      ...(op.operationId === "md_valuation" || op["x-read-only"] === true
        ? { readOnly: true }
        : {}),
      parameters: op.parameters.filter((p) => p.name !== "X-CSRF-Token"),
      ...(op.requestBody
        ? { request: op.requestBody.content["application/json"].schema }
        : {}),
      response: op.responses[status].content["application/json"].schema,
    };
  }
const result =
  '"use strict";\n// Generated from the reviewed first-party OpenAPI snapshot. Transport only.\nmodule.exports = ' +
  JSON.stringify({ operations }, null, 2) +
  ";\n";
const target = new URL("../src/market-data.cjs", import.meta.url);
const digest = createHash("sha256").update(raw).digest("hex") + "\n";
if (process.argv.includes("--check")) {
  if (
    fs.readFileSync(target, "utf8") !== result ||
    fs.readFileSync(
      new URL("../FIRST-PARTY-CONTRACT-SHA256", import.meta.url),
      "utf8",
    ) !== digest
  )
    throw Error("First-party contract drift");
} else {
  fs.writeFileSync(target, result);
  fs.writeFileSync(
    new URL("../FIRST-PARTY-CONTRACT-SHA256", import.meta.url),
    digest,
  );
}
