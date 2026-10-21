"use strict";
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
assertServer();
const { schemas, operations } = require("./contract.cjs");
const { valid, consistent } = require("./validate.cjs");
class BharosaError extends Error {
  constructor(
    kind,
    message,
    { status, requestId, code, param, type, outcome = "not_sent" } = {},
  ) {
    super(message);
    this.name = new.target.name;
    this.kind = kind;
    this.outcome = outcome;
    if (status !== undefined) this.status = status;
    if (requestId !== undefined) this.requestId = requestId;
    if (code !== undefined) this.code = code;
    if (param !== undefined) this.param = param;
    if (type !== undefined) this.type = type;
  }
}
class ValidationError extends BharosaError {
  constructor() {
    super("validation", "Invalid SDK configuration or request.");
  }
}
class APIError extends BharosaError {
  constructor(meta) {
    super("api", "Bharosa API rejected the request.", meta);
  }
}
class TransportError extends BharosaError {
  constructor(meta) {
    super(
      "transport",
      "Bharosa transport failed; no remote details retained.",
      meta,
    );
  }
}
class TimeoutError extends BharosaError {
  constructor(meta) {
    super("timeout", "Bharosa request exceeded its total timeout.", meta);
  }
}
class AbortError extends BharosaError {
  constructor(meta) {
    super("abort", "Bharosa request was cancelled.", meta);
  }
}
class InvalidResponseError extends BharosaError {
  constructor(meta) {
    super(
      "invalid_response",
      "Bharosa returned an invalid or unsupported response.",
      meta,
    );
  }
}
function check(v) {
  if (!v) throw new ValidationError();
}
function keys(v, allowed) {
  check(
    v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      Object.keys(v).every((k) => allowed.includes(k)),
  );
}
function origin(value, local) {
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
function token(v) {
  return typeof v === "string" && /^[!-~]+$/.test(v) && v.length <= 16384;
}
function options(o) {
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
function race(p, signal) {
  if (signal.aborted) return Promise.reject(new Error("cancelled"));
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error("cancelled"));
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(p)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", abort));
  });
}
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
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
async function read(response, max, signal) {
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
class Bharosa {
  constructor(config) {
    assertServer();
    keys(config, [
      "baseUrl",
      "account",
      "auth",
      "allowLocalhostHttp",
      "maxResponseBytes",
      "fetch",
    ]);
    check(
      config.allowLocalhostHttp === undefined ||
        typeof config.allowLocalhostHttp === "boolean",
    );
    const base = origin(config.baseUrl, config.allowLocalhostHttp);
    check(
      valid(operations.retrieve_account.parameters[0].schema, config.account),
    );
    const account = config.account;
    keys(config.auth, ["type", "apiKey", "userAccessToken"]);
    const a = config.auth;
    check(token(a.apiKey));
    check(
      (a.type === "account_key" && !Object.hasOwn(a, "userAccessToken")) ||
        (a.type === "delegated_application" && token(a.userAccessToken)),
    );
    const headers = Object.freeze({
      Authorization: "Bearer " + a.apiKey,
      ...(a.type === "delegated_application"
        ? { "Bharosa-User-Authorization": "Bearer " + a.userAccessToken }
        : {}),
      Accept: "application/json",
    });
    const secrets = [a.apiKey, a.userAccessToken].filter(Boolean);
    const safe = (v) =>
      typeof v === "string" &&
      !secrets.some((s) => v.includes(s)) &&
      v.length <= 512 &&
      !/[\r\n]/.test(v)
        ? v
        : undefined;
    const transport = config.fetch ?? globalThis.fetch;
    check(typeof transport === "function");
    const max = config.maxResponseBytes ?? 16777216;
    check(Number.isInteger(max) && max >= 1 && max <= 16777216);
    const call = async (id, params = {}, body, opts = {}) => {
      const op = operations[id];
      let o, serialized, url;
      try {
        o = options(opts);
        const supplied = { account, ...params };
        const query = new URLSearchParams();
        let path = op.path;
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
            path = path.replace("{" + p.name + "}", encodeURIComponent(value));
          if (p.in === "query") query.set(p.name, String(value));
        }
        check(!op.request || body !== undefined);
        if (body !== undefined) {
          check(!!op.request);
          check(valid(op.request, body));
          serialized = JSON.stringify(body);
          check(valid(op.request, JSON.parse(serialized)));
          if (body.positions)
            check(
              new Set(body.positions.map((x) => x.instrument)).size ===
                body.positions.length,
            );
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
      const meta = (extra) => ({
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
          let response,
            data,
            error,
            retry = false,
            retryAfter;
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
                if (
                  !valid(op.response, data) ||
                  !consistent(data, account) ||
                  (op.readOnly &&
                    (data.mix_type !== id.replace("_mix", "") ||
                      data.portfolio !==
                        (body.portfolio.type === "saved"
                          ? body.portfolio.id
                          : null) ||
                      (body.as_of !== undefined &&
                        data.as_of_date !== body.as_of))) ||
                  Object.entries(params).some(
                    ([k, v]) =>
                      ["client", "investor", "portfolio"].includes(k) &&
                      op.parameters.some(
                        (p) => p.in === "path" && p.name === k,
                      ) &&
                      (data.portfolio?.id ?? data.id) !== v,
                  )
                )
                  throw new InvalidResponseError(
                    meta({ status: response.status, requestId }),
                  );
                if (id === "fund_references") {
                  const asked = params.instruments.split(",");
                  const got = [
                    ...data.data.map((x) => x.instrument.id),
                    ...data.missing,
                  ];
                  if (
                    new Set(got).size !== got.length ||
                    got.length !== asked.length ||
                    got.some((x) => !asked.includes(x))
                  )
                    throw new InvalidResponseError(
                      meta({ status: response.status, requestId }),
                    );
                }
                if (Date.now() >= deadline) {
                  timedOut = true;
                  controller.abort();
                  throw interrupted();
                }
                return decorate(id, data);
              }
              if (
                !error &&
                (response.status < 400 ||
                  !valid(schemas.Error, data) ||
                  !requestId ||
                  data.error.request_id !== requestId)
              )
                error = new InvalidResponseError(
                  meta({ status: response.status, requestId }),
                );
              if (!error) {
                const e = data.error;
                uncertain ||=
                  response.status >= 500 ||
                  response.status === 408 ||
                  e.code === "request_in_progress";
                error = new APIError(
                  meta({
                    status: response.status,
                    requestId,
                    code: safe(e.code),
                    type: safe(e.type),
                    param: e.param === null ? null : safe(e.param),
                    outcome:
                      op.method === "GET" || op.readOnly
                        ? "not_applicable"
                        : uncertain ||
                            response.status >= 500 ||
                            response.status === 408 ||
                            e.code === "request_in_progress"
                          ? "unknown"
                          : "rejected",
                  }),
                );
                retry =
                  [408, 429, 502, 503, 504].includes(response.status) ||
                  (response.status === 409 &&
                    e.code === "request_in_progress" &&
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
    const list = (p) => {
      keys(p, ["limit", "startingAfter", "client"]);
      return Object.fromEntries(
        Object.entries(p)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k === "startingAfter" ? "starting_after" : k, v]),
      );
    };
    this.accounts = Object.freeze({
      retrieve: (o) => call("retrieve_account", {}, undefined, o),
    });
    this.clients = Object.freeze({
      list: (p = {}, o) => call("list_clients", list(p), undefined, o),
      retrieve: (client, o) =>
        call("retrieve_client", { client }, undefined, o),
    });
    this.investors = Object.freeze({
      list: (p = {}, o) => call("list_investors", list(p), undefined, o),
      retrieve: (investor, o) =>
        call("retrieve_investor", { investor }, undefined, o),
      create: (b, o) => call("create_investor", {}, b, o),
      update: (investor, b, o) => call("update_investor", { investor }, b, o),
    });
    const portfolioObject = (target, data = {}) => {
      const freeze = (value) => {
        if (value && typeof value === "object") {
          for (const child of Object.values(value)) freeze(child);
          Object.freeze(value);
        }
        return value;
      };
      const frozenTarget = freeze(JSON.parse(JSON.stringify(target)));
      const invoke = (kind, params = {}, o) => {
        keys(params, ["asOf"]);
        if (params.asOf !== undefined)
          check(
            valid(
              {
                type: "string",
                format: "date",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              },
              params.asOf,
            ),
          );
        return call(
          kind + "_mix",
          {},
          {
            portfolio: frozenTarget,
            ...(params.asOf === undefined ? {} : { as_of: params.asOf }),
          },
          o,
        );
      };
      if (frozenTarget.type === "in_memory")
        Object.defineProperty(data, "positions", {
          value: frozenTarget.positions,
        });
      if (frozenTarget.type === "saved")
        Object.defineProperty(data, "currentSnapshot", {
          value: (options) =>
            this.portfolios.snapshots.retrieveCurrent(frozenTarget.id, options),
        });
      Object.defineProperties(data, {
        assetMix: { value: (p, o) => invoke("asset", p, o) },
        sectorMix: { value: (p, o) => invoke("sector", p, o) },
        issuerMix: { value: (p, o) => invoke("issuer", p, o) },
      });
      return data;
    };
    const fundObject = (target, data = {}) => {
      const portfolio = portfolioObject(target);
      Object.defineProperties(data, {
        portfolio: { value: portfolio },
        assetMix: { value: (p, o) => portfolio.assetMix(p, o) },
        sectorMix: { value: (p, o) => portfolio.sectorMix(p, o) },
        issuerMix: { value: (p, o) => portfolio.issuerMix(p, o) },
      });
      return data;
    };
    const decorate = (id, data) => {
      if (id === "retrieve_portfolio")
        return portfolioObject({ type: "saved", id: data.id }, data);
      if (id === "list_portfolios")
        data.data = data.data.map((p) =>
          portfolioObject({ type: "saved", id: p.id }, p),
        );
      if (
        ["create_portfolio", "current_snapshot", "replace_snapshot"].includes(
          id,
        )
      )
        data.portfolio = portfolioObject(
          { type: "saved", id: data.portfolio.id },
          data.portfolio,
        );
      if (["search_funds", "fund_references"].includes(id))
        for (const choice of data.data)
          fundObject(
            { type: "fund_instrument", instrument: choice.instrument.id },
            choice.instrument,
          );
      return data;
    };
    const buildPortfolio = (input) => {
      keys(input, ["valuationDate", "positions", "currency"]);
      const target = {
        type: "in_memory",
        valuation_date: input.valuationDate,
        currency: input.currency ?? "INR",
        positions: input.positions,
      };
      check(valid(schemas.PortfolioMixRequest, { portfolio: target }));
      return portfolioObject(target);
    };
    this.portfolios = Object.freeze({
      build: buildPortfolio,
      fromPositions: buildPortfolio,
      list: (p = {}, o) => call("list_portfolios", list(p), undefined, o),
      retrieve: (portfolio, o) =>
        call("retrieve_portfolio", { portfolio }, undefined, o),
      create: (b, o) => call("create_portfolio", {}, b, o),
      snapshots: Object.freeze({
        retrieveCurrent: (portfolio, o) =>
          call("current_snapshot", { portfolio }, undefined, o),
        create: (portfolio, b, o) =>
          call("replace_snapshot", { portfolio }, b, o),
      }),
    });
    this.mutualFunds = Object.freeze({
      fromId: (mutualFundId) => {
        check(
          typeof mutualFundId === "string" &&
            /^[1-9][0-9]{0,18}$/.test(mutualFundId) &&
            BigInt(mutualFundId) <= 9223372036854775807n,
        );
        return fundObject(
          { type: "mutual_fund", mutual_fund_id: mutualFundId },
          { mutual_fund_id: mutualFundId },
        );
      },
      fromInstrument: (instrument) => {
        check(
          typeof instrument === "string" &&
            /^ins_[A-Za-z0-9_-]{1,150}$/.test(instrument),
        );
        return fundObject(
          { type: "fund_instrument", instrument },
          { instrument },
        );
      },
      search: (p, o) => call("search_funds", p, undefined, o),
      references: (p, o) => {
        keys(p, ["instruments"]);
        check(
          Array.isArray(p.instruments) &&
            p.instruments.length >= 1 &&
            p.instruments.length <= 100 &&
            new Set(p.instruments).size === p.instruments.length &&
            p.instruments.every((x) =>
              valid(
                { type: "string", pattern: "^ins_[A-Za-z0-9_-]{1,150}$" },
                x,
              ),
            ),
        );
        return call(
          "fund_references",
          { instruments: p.instruments.join(",") },
          undefined,
          o,
        );
      },
    });
    Object.freeze(this);
  }
}
module.exports = {
  Bharosa,
  BharosaError,
  ValidationError,
  APIError,
  TransportError,
  TimeoutError,
  AbortError,
  InvalidResponseError,
};
