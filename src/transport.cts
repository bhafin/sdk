import { operations as marketSearchOperations } from "./market-search.cjs";
import { operations as analyticsOperations } from "./analytics-contract.cjs";
import { operations as monthlyOperations } from "./monthly-market-data.cjs";
import type { OperationResults } from "./operation-types.cjs";
import { schemas, operations as resourceOperations } from "./contract.cjs";
import { operations as marketOperations } from "./market-data.cjs";
import { valid } from "./validate.cjs";
import { field, responseMatches } from "./response-checks.cjs";
import {
  BharosaError,
  ValidationError,
  APIError,
  TransportError,
  TimeoutError,
  AbortError,
  InvalidResponseError,
  type ErrorMetadata,
} from "./errors.cjs";
import type { BharosaConfig, RequestOptions } from "./client-types.cjs";
const operations = {
  ...resourceOperations,
  ...marketOperations,
  ...monthlyOperations,
  ...analyticsOperations,
  ...marketSearchOperations,
};
function assertServer() {
  if (
    typeof window !== "undefined" ||
    typeof document !== "undefined" ||
    typeof process === "undefined" ||
    !process.versions?.node
  )
    throw new Error("Bharosa requires server-side Node.js.");
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12))
    throw new Error("Bharosa requires Node.js >=22.12.");
}
if (typeof window === "undefined") assertServer();
export function check(v: unknown): asserts v {
  if (!v) throw new ValidationError();
}
export function keys(v: unknown, allowed: readonly string[]): void {
  check(
    v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      Object.keys(v).every((k) => allowed.includes(k)),
  );
}
function origin(value: unknown, local: unknown) {
  check(
    typeof value === "string" &&
      /^https?:\/\//.test(value) &&
      !/[\\\s?#]/.test(value),
  );
  let u;
  try {
    u = new URL(value);
  } catch {
    throw new ValidationError();
  }
  check(
    !u.username && !u.password && u.pathname === "/" && !u.search && !u.hash,
  );
  // Reject URL parser normalization tricks, numeric/encoded hosts, and implicit paths.
  check(value === u.origin || value === u.origin + "/");
  check(
    u.protocol === "https:" ||
      (local === true &&
        u.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)),
  );
  return u.origin;
}
function token(v: unknown): v is string {
  return typeof v === "string" && /^[!-~]+$/.test(v) && v.length <= 16384;
}
function options(o: RequestOptions) {
  keys(o, ["idempotencyKey", "signal", "timeoutMs", "maxRetries"]);
  check(
    o.idempotencyKey === undefined ||
      valid({ type: "string", pattern: "^[!-~]{1,255}$" }, o.idempotencyKey),
  );
  check(
    o.timeoutMs === undefined ||
      (Number.isInteger(o.timeoutMs) &&
        o.timeoutMs >= 1 &&
        o.timeoutMs <= 300000),
  );
  check(
    o.maxRetries === undefined ||
      (Number.isInteger(o.maxRetries) &&
        o.maxRetries >= 0 &&
        o.maxRetries <= 2),
  );
  check(o.signal === undefined || o.signal instanceof AbortSignal);
  return {
    ...o,
    timeoutMs: o.timeoutMs ?? 30000,
    maxRetries: o.maxRetries ?? 0,
  };
}
function race<T>(p: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(new Error("cancelled"));
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new Error("cancelled"));
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(p)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", abort));
  });
}
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("cancelled"));
      return;
    }
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      resolve();
    };
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new Error("cancelled"));
    };
    const timer = setTimeout(done, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}
async function read(
  response: Response,
  max: number,
  signal: AbortSignal,
): Promise<unknown> {
  if (!response.body) throw new Error("empty");
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await race(reader.read(), signal);
      if (done) break;
      size += value.byteLength;
      if (size > max) throw new Error("oversized");
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (e) {
    void reader.cancel().catch(() => {});
    throw e;
  } finally {
    reader.releaseLock();
  }
}
export function createTransport(input: BharosaConfig, marketOnly = false) {
  let config: Exclude<BharosaConfig, { apiKey: string }>;
  if (
    input != null &&
    typeof input === "object" &&
    Object.hasOwn(input, "apiKey")
  ) {
    keys(input, [
      "apiKey",
      "account",
      "baseUrl",
      "allowLocalhostHttp",
      "maxResponseBytes",
      "fetch",
    ]);
    const simple = input as Extract<BharosaConfig, { apiKey: string }>;
    const { apiKey, account, ...rest } = simple;
    config = {
      ...rest,
      account: account === undefined ? "me" : account,
      auth: { type: "account_key", apiKey },
    };
  } else {
    config = input as Exclude<BharosaConfig, { apiKey: string }>;
  }
  const customTransport = config?.transport !== undefined;
  if (!customTransport) assertServer();
  keys(config, [
    "baseUrl",
    "account",
    "auth",
    "allowLocalhostHttp",
    "maxResponseBytes",
    "fetch",
    "transport",
  ]);
  check(
    config.allowLocalhostHttp === undefined ||
      typeof config.allowLocalhostHttp === "boolean",
  );
  const base = origin(
    config.baseUrl === undefined
      ? "https://api.bharosa.finance"
      : config.baseUrl,
    config.allowLocalhostHttp,
  );
  check(
    valid(operations.retrieve_account.parameters[0].schema, config.account),
  );
  const account = config.account;

  let headers: Readonly<Record<string, string>>, secrets: string[];
  if (config.transport !== undefined) {
    check(config.auth === undefined && config.fetch === undefined);
    keys(config.transport, ["send"]);
    check(typeof config.transport.send === "function");
    headers = Object.freeze({ Accept: "application/json" });
    secrets = [];
  } else {
    const a = config.auth;
    keys(a, ["type", "apiKey", "userAccessToken"]);
    check(token(a.apiKey));
    check(
      (a.type === "account_key" && !Object.hasOwn(a, "userAccessToken")) ||
        (a.type === "delegated_application" && token(a.userAccessToken)),
    );
    headers = Object.freeze({
      Authorization: "Bearer " + a.apiKey,
      ...(a.type === "delegated_application" && !marketOnly
        ? { "Bharosa-User-Authorization": "Bearer " + a.userAccessToken }
        : {}),
      Accept: "application/json",
    });
    secrets = [a.apiKey, a.userAccessToken].filter(
      (v): v is string => typeof v === "string",
    );
  }
  const safe = (v: unknown) =>
    typeof v === "string" &&
    !secrets.some((s) => v.includes(s)) &&
    v.length <= 512 &&
    !/[\r\n]/.test(v)
      ? v
      : undefined;
  const transport =
    config.transport !== undefined
      ? config.transport.send.bind(config.transport)
      : (config.fetch ?? globalThis.fetch);
  check(typeof transport === "function");
  const max = config.maxResponseBytes ?? 16777216;
  check(Number.isInteger(max) && max >= 1 && max <= 16777216);
  const call = async <K extends keyof OperationResults>(
    id: K,
    params: Record<string, unknown> = {},
    body?: unknown,
    opts: RequestOptions = {},
  ): Promise<OperationResults[K]> => {
    const op = operations[id];
    if (
      marketOnly &&
      ![
        "monthly_nav",
        "monthly_expense",
        "monthly_portfolio",
        "monthly_holdings",
        "monthly_valuation",
        "fund_references",
        "analytics_scheme",
        "analytics_category",
        "searchMarketSchemes",
      ].includes(id)
    ) {
      throw Object.assign(new ValidationError(), {
        code: "market_only_operation",
      });
    }
    let o, serialized, url;
    try {
      o = options(opts);
      const supplied: Record<string, unknown> = { account, ...params };
      const query = new URLSearchParams();
      let path = marketOnly
        ? op.path.replace(
            "/v1/accounts/{account}/market-data",
            "/v1/market-data",
          )
        : op.path;
      if (marketOnly && id === "fund_references")
        path = "/v1/market-data/schemes/references";
      keys(
        params,
        op.parameters
          .filter((p) => p.in === "path" || p.in === "query")
          .map((p) => p.name)
          .filter((n) => n !== "account"),
      );
      for (const p of op.parameters) {
        let value = p.in === "header" ? o.idempotencyKey : supplied[p.name];
        if (value === undefined) {
          check(!p.required);
          continue;
        }
        check(valid(p.schema, value));
        if (p.in === "path")
          path = path.replace(
            "{" + p.name + "}",
            encodeURIComponent(String(value)),
          );
        if (p.in === "query") {
          if (Array.isArray(value))
            for (const item of value) query.append(p.name, String(item));
          else query.set(p.name, String(value));
        }
      }
      check(!op.request || body !== undefined);
      if (body !== undefined) {
        check(!!op.request);
        check(valid(op.request, body));
        serialized = JSON.stringify(body);
        check(valid(op.request, JSON.parse(serialized)));
        const positions = field(body, "positions");
        if (positions) {
          check(Array.isArray(positions));
          check(
            new Set(positions.map((x) => field(x, "instrument"))).size ===
              positions.length,
          );
        }
      }
      check(
        op.method === "GET" ||
          op.readOnly ||
          o.maxRetries === 0 ||
          o.idempotencyKey !== undefined,
      );
      url = base + path + (query.size ? "?" + query : "");
    } catch {
      throw new ValidationError();
    }
    const controller = new AbortController();
    let timedOut = false,
      attempted = false,
      uncertain = false;
    const external = () => controller.abort();
    o.signal?.addEventListener("abort", external, { once: true });
    if (o.signal?.aborted) controller.abort();
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, o.timeoutMs);
    const deadline = Date.now() + o.timeoutMs;
    const meta = (extra: ErrorMetadata = {}): ErrorMetadata => ({
      outcome:
        op.method === "GET" || op.readOnly
          ? "not_applicable"
          : attempted
            ? "unknown"
            : "not_sent",
      ...extra,
    });
    const interrupted = () =>
      timedOut ? new TimeoutError(meta()) : new AbortError(meta());
    try {
      for (let attempt = 0; ; attempt++) {
        if (controller.signal.aborted) throw interrupted();
        let response: Response | undefined,
          data: unknown,
          error: BharosaError | undefined,
          retry = false,
          retryAfter: string | null | undefined;
        try {
          attempted = true;
          response = await race(
            transport(url, {
              method: op.method,
              headers: {
                ...headers,
                ...(serialized === undefined
                  ? {}
                  : { "Content-Type": "application/json" }),
                ...(o.idempotencyKey
                  ? { "Idempotency-Key": o.idempotencyKey }
                  : {}),
              },
              body: serialized,
              signal: controller.signal,
              redirect: "error",
              credentials: "omit",
              cache: "no-store",
            }).then((received) => {
              // A caller-owned transport may ignore abort. Discard a late body
              // instead of retaining an unread stream after the request ended.
              if (controller.signal.aborted)
                void received.body?.cancel().catch(() => {});
              return received;
            }),
            controller.signal,
          );
        } catch {
          if (controller.signal.aborted) throw interrupted();
          uncertain = true;
          error = new TransportError(meta());
          retry = true;
        }
        if (response) {
          try {
            retry = [408, 429, 502, 503, 504].includes(response.status);
            retryAfter = response.headers.get("Retry-After");
            uncertain ||= response.status >= 500 || response.status === 408;
            const requestId = safe(response.headers.get("Request-Id"));
            if (
              (response.status >= 300 && response.status < 400) ||
              response.redirected
            ) {
              void response.body?.cancel().catch(() => {});
              throw new InvalidResponseError(
                meta({ status: response.status, requestId }),
              );
            }
            try {
              check(
                /^application\/json(?:\s*;|$)/i.test(
                  response.headers.get("Content-Type") ?? "",
                ),
              );
              data = await read(response, max, controller.signal);
            } catch {
              if (controller.signal.aborted) throw interrupted();
              error = new InvalidResponseError(
                meta({ status: response.status, requestId }),
              );
            }
            if (Date.now() >= deadline) {
              timedOut = true;
              controller.abort();
              throw interrupted();
            }
            if (!error && response.status === op.status) {
              if (!responseMatches(id, op, data, params, body, account))
                throw new InvalidResponseError(
                  meta({ status: response.status, requestId }),
                );
              if (Date.now() >= deadline) {
                timedOut = true;
                controller.abort();
                throw interrupted();
              }
              // The generated operation schema and identity/provenance checks above
              // validate this JSON boundary before it receives its operation type.
              return data as OperationResults[K];
            }
            if (
              !error &&
              (response.status < 400 ||
                !valid(schemas.Error, data) ||
                !requestId ||
                field(data, "error", "request_id") !== requestId)
            )
              error = new InvalidResponseError(
                meta({ status: response.status, requestId }),
              );
            if (!error) {
              const e = field(data, "error");
              uncertain ||=
                response.status >= 500 ||
                response.status === 408 ||
                field(e, "code") === "request_in_progress";
              error = new APIError(
                meta({
                  status: response.status,
                  requestId,
                  code: safe(field(e, "code")),
                  type: safe(field(e, "type")),
                  param:
                    field(e, "param") === null ? null : safe(field(e, "param")),
                  outcome:
                    op.method === "GET" || op.readOnly
                      ? "not_applicable"
                      : uncertain ||
                          response.status >= 500 ||
                          response.status === 408 ||
                          field(e, "code") === "request_in_progress"
                        ? "unknown"
                        : "rejected",
                }),
              );
              retry =
                [408, 429, 502, 503, 504].includes(response.status) ||
                (response.status === 409 &&
                  field(e, "code") === "request_in_progress" &&
                  !!o.idempotencyKey);
            }
          } finally {
            // Discard unsupported or rejected bodies before retrying, including
            // streams never acquired by read(). Never await an untrusted cancel.
            void response.body?.cancel().catch(() => {});
          }
        }
        if (!retry || attempt >= o.maxRetries) throw error;
        let pause = Math.random() * Math.min(2000, 250 * 2 ** attempt);
        if (retryAfter) {
          const n = /^\d+$/.test(retryAfter)
            ? Number(retryAfter) * 1000
            : Date.parse(retryAfter) - Date.now();
          if (Number.isFinite(n) && n >= 0) pause = Math.max(pause, n);
        }
        if (pause >= deadline - Date.now()) {
          await delay(Math.max(1, deadline - Date.now()), controller.signal);
          timedOut = true;
          controller.abort();
          throw interrupted();
        }
        await delay(pause, controller.signal);
      }
    } catch (e) {
      if (controller.signal.aborted) throw interrupted();
      if (e instanceof BharosaError) throw e;
      throw new TransportError(meta());
    } finally {
      controller.abort();
      clearTimeout(timer);
      o.signal?.removeEventListener("abort", external);
    }
  };
  return call;
}
