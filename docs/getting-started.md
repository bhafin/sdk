# Getting started

## Prerequisites

Use Node.js 22.12 or later in a supported LTS release. The SDK supports ESM and CommonJS. Key-based authentication is server-only; keep credentials in your backend or server that handles browser sessions. Browser applications can supply a generic transport whose private host implementation manages sessions, origin restrictions and CSRF. Bun and Deno are unsupported.

Obtain an API key. For private account calls, enable the needed optional own-account permissions; the simple API-key configuration defaults to account selector `me`. Bharosa and BharosaMarket default to the production origin `https://api.bharosa.finance`; no API URL environment variable is required. The SDK neither provisions accounts nor runs an OAuth consent flow.

## Install from npm

```sh
npm install bharosa
```

Source contributors can build and pack a local archive as described in CONTRIBUTING.md.

## Read your account

This call requires the optional own-account read permission. An account ID is not a prerequisite: the API-key shorthand selects `me`. Use an explicit `account` only when needed; delegated access uses the server-authorized account.

In an ESM application, save this as `account.mjs`:

```js
import { Bharosa } from "bharosa";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const bharosa = new Bharosa({
  apiKey: required("BHAROSA_SECRET_KEY"),
});
const account = await bharosa.accounts.retrieve();
console.log(account.id);
```

Supply `BHAROSA_SECRET_KEY` through your application's secret management, then run `node account.mjs`. Do not commit their values. For another deployment or tests, explicitly supply `baseUrl`. It must use HTTPS and contain no path, query, user information, or fragment; local HTTP additionally requires `allowLocalhostHttp: true`. Invalid explicit origins fail before sending a request.

CommonJS applications use `const { Bharosa } = require("bharosa")` inside an async function. TypeScript applications import types from the same root package; do not import files from `dist/`.

## Delegated access

Use `auth: { type: "delegated_application", apiKey: applicationKey, userAccessToken }` with the account selected by the server-issued authorization for that user and account. Both credentials are required. A direct account key cannot carry a user access token. The SDK does not obtain or refresh tokens. Create a new client when credentials or account change; each client is immutable.

## Lists and fields

A client represents a person or family group; an investor represents one member. Their IDs come from API responses, not names you invent. Lists take `{ limit, startingAfter }`. Investor and portfolio lists also accept `client`. Body/response fields use snake_case; the SDK maps `startingAfter` to the HTTP `starting_after` query parameter. To continue a list, use its `has_more` indicator and the last returned resource ID as the next cursor. Do not assume every list fits in one response.

Money is represented by decimal strings. Keep it as strings or use an appropriate decimal library in your application; converting to JavaScript Number can lose precision. Dates are financial dates in Asia/Kolkata, not local browser dates.

To try the interface without an API or credentials, use the [synthetic examples](../examples/README.md).

## Caller-owned transport and first-party market data

`BharosaTransport.send(url: string, request: RequestInit): Promise<Response>`
can replace credential configuration. Construct with `account`, an optional `baseUrl`, and
`transport`; do not also pass `auth` or `fetch`. The host application owns its
private session adapter, URL/origin restrictions, per-write CSRF, cookie policy
and cancellation on account changes. SDK requests default to omitted credentials,
redirect errors and no-store caching. This interface confers no API privileges.

`client.marketData` exposes fund owners, investible schemes, AMCs, managers,
categories, dated portfolios, NAVs and expense observations. These operations
currently require a signed-in session in an authorized Bharosa application. Key/delegated clients
receive authorization errors; method availability does not grant access.
`schemes.valuation(id, {units, asOf, positionDate})` returns either an available
exact decimal value with actual NAV date/freshness or an explicit unavailable
reason. Latest means on/before the cutoff, not necessarily today's price. Stored
normalized expense values are returned unchanged, including null missingness.
Lists use limit/startingAfter; history lists use inclusive from/to and report
observations only, not complete coverage. Fund IDs identify portfolio owners;
scheme IDs identify investible products; neither identifies the AMC.

The first-party schema has a separate FIRST-PARTY-CONTRACT-SHA256 digest.
No database loaders, analytics implementations, market samples or session logic
are packaged in the SDK.
