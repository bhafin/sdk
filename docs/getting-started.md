# Getting started

## Prerequisites

Use Node.js 22.12 or later in a supported LTS release. The SDK supports ESM and CommonJS. Key-based authentication is server-only; keep credentials in your backend or BFF. Browser applications can supply a generic transport whose private host implementation manages sessions, origin restrictions and CSRF. Bun and Deno are unsupported.

Obtain an authorized API origin, account ID, and account key through your deployment's provisioning process. There is no default public origin. The SDK neither provisions accounts nor runs an OAuth consent flow.

## Install a local build

From the SDK directory:

```sh
npm run build
npm pack --pack-destination /absolute/path/to/artifacts
```

Then, from your application directory:

```sh
npm install /absolute/path/to/artifacts/bharosa-0.0.0-development.tgz
```

Use the filename produced by `npm pack` if the development version changes. This installs your local artifact; `npm install bharosa` is not a verified public installation path. The package remains private and publication is disabled.

## Read your account

In an ESM application, save this as `account.mjs`:

```js
import { Bharosa } from "bharosa";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const bharosa = new Bharosa({
  baseUrl: required("BHAROSA_API_BASE_URL"),
  account: required("BHAROSA_ACCOUNT_ID"),
  auth: { type: "account_key", apiKey: required("BHAROSA_SECRET_KEY") },
});
const account = await bharosa.accounts.retrieve();
console.log(account.id);
```

Supply those variables through your application's secret management, then run `node account.mjs`. Do not commit their values. The origin must use HTTPS and contain no path, query, user information, or fragment.

CommonJS applications use `const { Bharosa } = require("bharosa")` inside an async function. TypeScript applications import types from the same root package; do not import files from `dist/`.

## Delegated access

Use `auth: { type: "delegated_application", apiKey: applicationKey, userAccessToken }` with the account selected by the authoritative server grant. Both credentials are required. A direct account key cannot carry a user access token. The SDK does not obtain or refresh tokens. Create a new client when credentials or account change; each client is immutable.

## Lists and fields

Lists take `{ limit, startingAfter }`. Investor and portfolio lists also accept `client`. Body/response fields use snake_case; the SDK maps `startingAfter` to the HTTP `starting_after` query parameter. To continue a list, use its `has_more` indicator and the last returned resource ID as the next cursor. Do not assume every list fits in one response.

Money is represented by decimal strings. Keep it as strings or use an appropriate decimal library in your application; converting to JavaScript Number can lose precision. Dates are financial dates in Asia/Kolkata, not local browser dates.

To try the interface without an API or credentials, use the [synthetic examples](../examples/README.md).


## Caller-owned transport and first-party market data

`BharosaTransport.send(url: string, request: RequestInit): Promise<Response>`
can replace credential configuration. Construct with `baseUrl`, `account` and
`transport`; do not also pass `auth` or `fetch`. The host application owns its
private session adapter, URL/origin restrictions, per-write CSRF, cookie policy
and cancellation on account changes. SDK requests default to omitted credentials,
redirect errors and no-store caching. This interface confers no API privileges.

`client.marketData` exposes fund owners, investible schemes, AMCs, managers,
categories, dated portfolios, NAVs and expense observations. The new operations
currently require server-validated first-party sessions. Key/delegated clients
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
