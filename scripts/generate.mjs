import fs from "node:fs";
import crypto from "node:crypto";
const raw = fs.readFileSync(
  new URL("../test/openapi.json", import.meta.url),
  "utf8",
);
const spec = JSON.parse(raw);
const schemas = spec.components.schemas;
const operations = {};
for (const [path, methods] of Object.entries(spec.paths))
  for (const [method, o] of Object.entries(methods)) {
    const status = Object.keys(o.responses).find((s) => /^2/.test(s));
    operations[o.operationId] = {
      path,
      readOnly: o["x-read-only"] === true,
      method: method.toUpperCase(),
      parameters: o.parameters,
      request: o.requestBody?.content["application/json"].schema,
      status: Number(status),
      response: o.responses[status].content["application/json"].schema,
    };
  }
fs.writeFileSync(
  new URL("../src/contract.cjs", import.meta.url),
  "// Generated from frozen OpenAPI; do not edit.\nmodule.exports = " +
    JSON.stringify({ schemas, operations }) +
    ";\n",
);
function type(s) {
  if (s.$ref)
    return s.$ref.split("/").at(-1) === "Error"
      ? "ErrorEnvelope"
      : s.$ref.split("/").at(-1);
  if ("const" in s) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ");
  if (s.anyOf) return s.anyOf.map(type).join(" | ");
  if (s.type === "object")
    return (
      "{ " +
      Object.entries(s.properties ?? {})
        .map(
          ([k, v]) =>
            JSON.stringify(k) +
            (s.required?.includes(k) ? "" : "?") +
            ": " +
            type(v) +
            ";",
        )
        .join(" ") +
      (s.additionalProperties === true ? " [key: string]: unknown;" : "") +
      " }"
    );
  if (s.type === "array") return "Array<" + type(s.items) + ">";
  if (s.type === "integer" || s.type === "number") return "number";
  if (["string", "boolean", "null"].includes(s.type)) return s.type;
  throw Error("Unhandled schema");
}
fs.writeFileSync(
  new URL("../src/models.d.ts", import.meta.url),
  "// Generated from canonical schema; decimal amounts remain strings.\n" +
    Object.entries(schemas)
      .map(
        ([k, v]) =>
          "export type " +
          (k === "Error" ? "ErrorEnvelope" : k) +
          " = " +
          type(v) +
          ";",
      )
      .join("\n") +
    "\n",
);
fs.writeFileSync(
  new URL("../CONTRACT-SHA256", import.meta.url),
  crypto.createHash("sha256").update(raw).digest("hex") +
    "  marketing/contracts/openapi.json\n",
);
