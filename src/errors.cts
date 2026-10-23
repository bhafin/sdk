import type { MutationOutcome } from "./client-types.cjs";
export type ErrorKind =
  "validation" | "api" | "transport" | "timeout" | "abort" | "invalid_response";
export interface ErrorMetadata {
  status?: number;
  requestId?: string;
  code?: string;
  param?: string | null;
  type?: string;
  outcome?: MutationOutcome;
}
export class BharosaError extends Error {
  declare readonly kind: ErrorKind;
  declare readonly outcome: MutationOutcome;
  declare readonly status?: number;
  declare readonly requestId?: string;
  declare readonly code?: string;
  declare readonly param?: string | null;
  declare readonly type?: string;
  /** Legacy declarations exposed Error-style construction. These forms preserve
   * the original JavaScript behavior: the first argument is still `kind`, and
   * the second argument (including an ErrorOptions object) is still the message.
   * Prefer catching SDK errors or the explicit kind/message/metadata overload. */
  constructor(message?: string, options?: ErrorOptions);
  constructor(
    kind: ErrorKind,
    message: string,
    metadata?: ErrorMetadata | string,
  );
  constructor(
    kind?: string,
    message?: string | ErrorOptions,
    metadata: ErrorMetadata | string = {},
  ) {
    // Parameter destructuring in the original implementation read metadata
    // before coercing the message, including properties inherited by primitives.
    if (metadata === null)
      throw new TypeError("Cannot destructure null metadata");
    const boxed: object = Object(metadata);
    const status: unknown = Reflect.get(boxed, "status");
    const requestId: unknown = Reflect.get(boxed, "requestId");
    const code: unknown = Reflect.get(boxed, "code");
    const param: unknown = Reflect.get(boxed, "param");
    const type: unknown = Reflect.get(boxed, "type");
    const outcome: unknown = Reflect.get(boxed, "outcome");
    // Error coerces its message, but omission does not create an own property.
    // Legacy options are the message here; they must not become Error.cause.
    super(message === undefined ? undefined : `${message}`);
    this.name = new.target.name;
    Object.assign(this, {
      kind,
      outcome: outcome === undefined ? "not_sent" : outcome,
    });
    for (const [field, value] of Object.entries({
      status,
      requestId,
      code,
      param,
      type,
    })) {
      if (value !== undefined) Object.assign(this, { [field]: value });
    }
  }
}
export class ValidationError extends BharosaError {
  constructor(message?: string, options?: ErrorOptions);
  constructor(_message?: string, _options?: ErrorOptions) {
    super(
      "validation",
      "Check the SDK configuration and request fields against the method documentation. The request was not sent.",
    );
  }
}
export class APIError extends BharosaError {
  constructor(metadata?: ErrorMetadata);
  constructor(message?: string, options?: ErrorOptions);
  constructor(meta: ErrorMetadata | string = {}, _options?: ErrorOptions) {
    super(
      "api",
      "Bharosa rejected the request. Check code and param for the reason, and include requestId when contacting support.",
      meta,
    );
  }
}
export class TransportError extends BharosaError {
  constructor(metadata?: ErrorMetadata);
  constructor(message?: string, options?: ErrorOptions);
  constructor(meta: ErrorMetadata | string = {}, _options?: ErrorOptions) {
    super(
      "transport",
      "Could not reach Bharosa or read its response. Check your connection. For a write, inspect outcome before retrying with the original idempotency key.",
      meta,
    );
  }
}
export class TimeoutError extends BharosaError {
  constructor(metadata?: ErrorMetadata);
  constructor(message?: string, options?: ErrorOptions);
  constructor(meta: ErrorMetadata | string = {}, _options?: ErrorOptions) {
    super(
      "timeout",
      "The request timed out. For a write, check outcome before retrying; the server may already have saved it.",
      meta,
    );
  }
}
export class AbortError extends BharosaError {
  constructor(metadata?: ErrorMetadata);
  constructor(message?: string, options?: ErrorOptions);
  constructor(meta: ErrorMetadata | string = {}, _options?: ErrorOptions) {
    super(
      "abort",
      "The request was cancelled. Cancellation does not undo a write already saved by the server; check outcome before retrying.",
      meta,
    );
  }
}
export class InvalidResponseError extends BharosaError {
  constructor(metadata?: ErrorMetadata);
  constructor(message?: string, options?: ErrorOptions);
  constructor(meta: ErrorMetadata | string = {}, _options?: ErrorOptions) {
    super(
      "invalid_response",
      "The response did not match the expected format. Contact support with requestId. For a write, check outcome before retrying.",
      meta,
    );
  }
}
