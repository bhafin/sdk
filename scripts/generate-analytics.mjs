import fs from "node:fs";
import { createHash } from "node:crypto";
const raw = fs.readFileSync(
  new URL("../test/analytics.openapi.json", import.meta.url),
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
      marketData: op.operationId !== "analytics_portfolio",
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
  '"use strict";\n// Generated from the reviewed analytics OpenAPI snapshot. Transport only.\nmodule.exports = ' +
  JSON.stringify({ operations }, null, 2) +
  ";\n";
const target = new URL("../src/analytics-contract.cjs", import.meta.url);
const digest = createHash("sha256").update(raw).digest("hex") + "\n";
if (process.argv.includes("--check")) {
  if (
    fs.readFileSync(target, "utf8") !== result ||
    fs.readFileSync(
      new URL("../ANALYTICS-CONTRACT-SHA256", import.meta.url),
      "utf8",
    ) !== digest
  )
    throw Error("Monthly market contract drift");
} else {
  fs.writeFileSync(target, result);
  fs.writeFileSync(
    new URL("../ANALYTICS-CONTRACT-SHA256", import.meta.url),
    digest,
  );
}
