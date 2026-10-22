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
if (typeof window === "undefined") assertServer();
const { schemas, operations: resourceOperations } = require("./contract.cjs");
const operations = {
  ...resourceOperations,
  ...require("./market-data.cjs").operations,
};
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
    super(
      "validation",
      "Check the SDK configuration and request fields against the method documentation. The request was not sent.",
    );
  }
}
class APIError extends BharosaError {
  constructor(meta) {
    super(
      "api",
      "Bharosa rejected the request. Check code and param for the reason, and include requestId when contacting support.",
      meta,
    );
  }
}
class TransportError extends BharosaError {
  constructor(meta) {
    super(
      "transport",
      "Could not reach Bharosa or read its response. Check your connection. For a write, inspect outcome before retrying with the original idempotency key.",
      meta,
    );
  }
}
class TimeoutError extends BharosaError {
  constructor(meta) {
    super(
      "timeout",
      "The request timed out. For a write, check outcome before retrying; the server may already have saved it.",
      meta,
    );
  }
}
class AbortError extends BharosaError {
  constructor(meta) {
    super(
      "abort",
      "The request was cancelled. Cancellation does not undo a write already saved by the server; check outcome before retrying.",
      meta,
    );
  }
}
class InvalidResponseError extends BharosaError {
  constructor(meta) {
    super(
      "invalid_response",
      "The response did not match the expected format. Contact support with requestId. For a write, check outcome before retrying.",
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
    const base = origin(config.baseUrl, config.allowLocalhostHttp);
    check(
      valid(operations.retrieve_account.parameters[0].schema, config.account),
    );
    const account = config.account;
    const a = config.auth;
    let headers, secrets;
    if (customTransport) {
      check(config.auth === undefined && config.fetch === undefined);
      keys(config.transport, ["send"]);
      check(typeof config.transport.send === "function");
      headers = Object.freeze({ Accept: "application/json" });
      secrets = [];
    } else {
      keys(a, ["type", "apiKey", "userAccessToken"]);
      check(token(a.apiKey));
      check(
        (a.type === "account_key" && !Object.hasOwn(a, "userAccessToken")) ||
          (a.type === "delegated_application" && token(a.userAccessToken)),
      );
      headers = Object.freeze({
        Authorization: "Bearer " + a.apiKey,
        ...(a.type === "delegated_application"
          ? { "Bharosa-User-Authorization": "Bearer " + a.userAccessToken }
          : {}),
        Accept: "application/json",
      });
      secrets = [a.apiKey, a.userAccessToken].filter(Boolean);
    }
    const safe = (v) =>
      typeof v === "string" &&
      !secrets.some((s) => v.includes(s)) &&
      v.length <= 512 &&
      !/[\r\n]/.test(v)
        ? v
        : undefined;
    const transport = customTransport
      ? config.transport.send.bind(config.transport)
      : (config.fetch ?? globalThis.fetch);
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
                const badMarket =
                  op.marketData &&
                  ((id.endsWith("_get") && data?.id !== params.id) ||
                    ([
                      "md_navs",
                      "md_expenses",
                      "md_portfolios",
                      "md_holdings",
                    ].includes(id) &&
                      data?.data?.some(
                        (row) =>
                          row[
                            id === "md_portfolios"
                              ? "fund_id"
                              : id === "md_holdings"
                                ? "portfolio_id"
                                : "scheme_id"
                          ] !== params.id,
                      )) ||
                    (id === "md_valuation" &&
                      ((body.position_date !== undefined &&
                        data?.position_date !== body.position_date) ||
                        data?.nav?.date > data?.as_of)) ||
                    (id === "current_holdings" &&
                      (data?.holdings?.length !== body.holdings.length ||
                        data?.holdings?.some((row, i) => {
                          const input = body.holdings[i].observed_position,
                            d = row.derivation;
                          const canonicalDecimal = (v) =>
                            typeof v === "string"
                              ? v
                                  .replace(/(\.\d*?)0+$/, "$1")
                                  .replace(/\.$/, "")
                              : v;
                          return d?.kind === "amount_divided_by_nav"
                            ? d.position_date !== input.date ||
                                canonicalDecimal(d.original_amount) !==
                                  canonicalDecimal(
                                    input.current_value?.amount,
                                  ) ||
                                d.nav?.date > input.date ||
                                d.nav?.amount === "0"
                            : d?.kind !== "supplied" || input.quantity == null;
                        }))));
                if (badMarket)
                  throw new InvalidResponseError(
                    meta({ status: response.status, requestId }),
                  );
                if (
                  id === "md_valuation" &&
                  (data.scheme_id !== body.scheme_id ||
                    (body.as_of !== undefined && data.as_of !== body.as_of) ||
                    (data.status === "unavailable" && data.value !== undefined))
                )
                  throw new InvalidResponseError(
                    meta({ status: response.status, requestId }),
                  );

                if (
                  !valid(op.response, data) ||
                  !consistent(data, account) ||
                  (op.readOnly &&
                    !op.marketData &&
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
                      !["history_capabilities", "list_holdings"].includes(id) &&
                      (typeof data.portfolio === "string"
                        ? data.portfolio
                        : (data.portfolio?.id ?? data.id)) !== v,
                  )
                )
                  throw new InvalidResponseError(
                    meta({ status: response.status, requestId }),
                  );
                if (
                  (id === "retrieve_holding" && data.id !== params.holding) ||
                  (id === "holding_position" &&
                    (data.holding !== params.holding ||
                      data.position_date !== params.date)) ||
                  (id === "history_capabilities" &&
                    data.date !== params.date) ||
                  (id === "list_holdings" &&
                    data.data.some((h) => h.portfolio !== params.portfolio)) ||
                  (op.readOnly &&
                    !op.marketData &&
                    body.position_date !== undefined &&
                    data.position_date !== body.position_date) ||
                  (op.readOnly &&
                    !op.marketData &&
                    body.valuation_date !== undefined &&
                    data.valuation_date !== body.valuation_date)
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
    const checkedDate = (value) => {
      check(
        valid(
          { type: "string", format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          value,
        ),
      );
      return value;
    };
    const holdingObject = (data) => {
      const scope = { portfolio: data.portfolio, holding: data.id };
      Object.defineProperty(data, "positionOn", {
        value: (date, options) =>
          call(
            "holding_position",
            { ...scope, date: checkedDate(date) },
            undefined,
            options,
          ),
      });
      return data;
    };
    const portfolioObject = (target, data = {}, positionDate) => {
      const freeze = (value) => {
        if (value && typeof value === "object") {
          for (const child of Object.values(value)) freeze(child);
          Object.freeze(value);
        }
        return value;
      };
      const frozenTarget = freeze(JSON.parse(JSON.stringify(target)));
      const invoke = (kind, params = {}, o) => {
        keys(params, positionDate ? ["asOf", "valuationDate"] : ["asOf"]);
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
            ...(positionDate === undefined
              ? {}
              : { position_date: positionDate }),
            ...(params.valuationDate === undefined
              ? {}
              : { valuation_date: checkedDate(params.valuationDate) }),
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
      if (["saved", "in_memory"].includes(frozenTarget.type))
        Object.defineProperty(data, "on", {
          value: (date) =>
            Object.freeze(portfolioObject(frozenTarget, {}, checkedDate(date))),
        });
      if (frozenTarget.type === "saved") {
        const scope = { portfolio: frozenTarget.id };
        Object.defineProperties(data, {
          history: {
            value: Object.freeze({
              retrieve: (options) =>
                call("retrieve_history", scope, undefined, options),
              import: (body, options) =>
                call("import_history", scope, body, options),
              canReconstruct: (date, options) =>
                call(
                  "history_capabilities",
                  { ...scope, date: checkedDate(date) },
                  undefined,
                  options,
                ),
            }),
          },
          holdings: {
            value: Object.freeze({
              setCurrent: (body, options) =>
                call("current_holdings", scope, body, options),
              list: (params = {}, options) => {
                keys(params, ["date"]);
                return call(
                  "list_holdings",
                  {
                    ...scope,
                    ...(params.date === undefined
                      ? {}
                      : { date: checkedDate(params.date) }),
                  },
                  undefined,
                  options,
                );
              },
              retrieve: (holding, options) =>
                call(
                  "retrieve_holding",
                  { ...scope, holding },
                  undefined,
                  options,
                ),
            }),
          },
        });
      }
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
      if (id === "retrieve_holding") return holdingObject(data);
      if (id === "list_holdings") data.data = data.data.map(holdingObject);
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
    const listQuery = (query = {}) => {
      keys(query, [
        "limit",
        "startingAfter",
        "query",
        "amc",
        "category",
        "manager",
        "fund",
        "from",
        "to",
      ]);
      const { startingAfter, ...rest } = query;
      return {
        ...rest,
        ...(startingAfter === undefined
          ? {}
          : { starting_after: startingAfter }),
      };
    };
    const marketCollection = (name) =>
      Object.freeze({
        list: (query, opts) =>
          call("md_" + name, listQuery(query), undefined, opts),
        ...(name === "categories"
          ? {}
          : {
              retrieve: (id, opts) =>
                call("md_" + name + "_get", { id }, undefined, opts),
            }),
        ...(name === "funds"
          ? {
              portfolios: (id, query, opts) =>
                call(
                  "md_portfolios",
                  { id, ...listQuery(query) },
                  undefined,
                  opts,
                ),
            }
          : {}),
        ...(name === "schemes"
          ? {
              navs: (id, query, opts) =>
                call("md_navs", { id, ...listQuery(query) }, undefined, opts),
              expenseRatios: (id, query, opts) =>
                call(
                  "md_expenses",
                  { id, ...listQuery(query) },
                  undefined,
                  opts,
                ),
              valuation: (id, input = {}, opts) => {
                keys(input, ["units", "asOf", "positionDate", "observedValue"]);
                const { units, asOf, positionDate, observedValue } = input;
                return call(
                  "md_valuation",
                  {},
                  {
                    scheme_id: id,
                    ...(units === undefined ? {} : { units }),
                    ...(asOf === undefined ? {} : { as_of: asOf }),
                    ...(positionDate === undefined
                      ? {}
                      : { position_date: positionDate }),
                    ...(observedValue === undefined
                      ? {}
                      : { observed_value: observedValue }),
                  },
                  opts,
                );
              },
            }
          : {}),
      });
    this.marketData = Object.freeze({
      funds: marketCollection("funds"),
      schemes: marketCollection("schemes"),
      amcs: marketCollection("amcs"),
      managers: marketCollection("managers"),
      categories: marketCollection("categories"),
      portfolios: Object.freeze({
        holdings: (id, query, opts) =>
          call("md_holdings", { id, ...listQuery(query) }, undefined, opts),
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
