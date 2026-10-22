# Errors and request reliability

Every SDK error extends `BharosaError`. Subclasses distinguish local validation, API rejection, transport failure, timeout, cancellation, and invalid responses. Inspect `kind`, `outcome`, and available `status`, `code`, `type`, `param`, and `requestId`. Do not parse message strings. Messages explain next steps without copying potentially sensitive server or network details.

| Outcome          | Meaning                                                       |
| ---------------- | ------------------------------------------------------------- |
| `not_sent`       | The SDK did not dispatch the request.                         |
| `rejected`       | The API rejected it, with no earlier uncertain attempt.       |
| `unknown`        | A mutation may have committed; reconcile before resubmitting. |
| `not_applicable` | A read-only operation has no mutation outcome.                |

Cancellation cannot undo a server commit. Preserve an application's operation ID, idempotency key, and submitted body outside the SDK when reconciliation is needed. Do not log keys, access tokens, or full financial responses.

## Timeouts and retries

A request has one total deadline, including retries: 30 seconds by default, configurable from 1 millisecond to 300 seconds. Retries default to zero and may be set to 1 or 2. Requests accept an `AbortSignal`.

Retryable transport failures and HTTP 408, 429, 502, 503, and 504 use bounded backoff within the deadline. Eligible keyed `request_in_progress` responses can also retry. The SDK does not automatically retry 401, 403, 500, snapshot conflicts, or idempotency-key reuse errors. Retry eligibility for these HTTP statuses does not depend on a well-formed JSON error body.

## Mutations

Creates require an idempotency key. Investor updates accept an optional key, but need one when retrying. Reuse the same key only for the same logical operation and unchanged body. Generate a new key for a different operation.

Successful responses are retained for 24 hours from server recording time. Replay does not extend that window. After an uncertain mutation, do not automatically resubmit after retention expires; reconcile server state first. Snapshot replacement also requires `expected_snapshot` to protect against concurrent updates.

See [create-investor.ts](../examples/create-investor.ts) for a typed request that accepts a caller-managed idempotency key.

## Transport boundaries

Requests refuse redirects and omit cookies by default. A caller-owned browser transport may attach session cookies and CSRF headers only within the host application’s approved origin policy. The SDK does not accept arbitrary credential/account/origin header overrides. Response bodies are capped at 16 MiB; `maxResponseBytes` can lower the limit. A custom `fetch` implementation receives credentials, so inject only trusted test or server code. The synthetic examples use a mock transport and never call a live service.
