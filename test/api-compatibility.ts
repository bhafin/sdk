// Frozen pre-migration declarations are an independent compatibility oracle.
import { Bharosa as Current } from "../dist/index.js";
import { Bharosa as Previous } from "./legacy-types/index.js";
declare const current: Current;
declare const previous: Previous;
// Intentional prelaunch changes: resource aliases are additive; Account.owner is removed.
const previousSurface: Omit<Previous, "accounts" | "portfolios"> = current;
const currentSurface: Omit<
  Current,
  | "markets"
  | "fundCategories"
  | "marketSnapshots"
  | "mutualFundSchemes"
  | "mutualFunds"
  | "accounts"
  | "portfolios"
> = previous;
const previousFunds: Previous["mutualFunds"] = current.mutualFunds;
const currentFunds: Omit<
  Current["mutualFunds"],
  "portfolios" | "aum" | "retrieve" | "fromId"
> = previous.mutualFunds;
void previousSurface;
void currentSurface;
void previousFunds;
void currentFunds;

import * as CurrentErrors from "../dist/index.js";
import * as PreviousErrors from "./legacy-types/index.js";
const legacyBharosaError: typeof PreviousErrors.BharosaError =
  CurrentErrors.BharosaError;
new legacyBharosaError();
new CurrentErrors.BharosaError();
new CurrentErrors.BharosaError("message");
new CurrentErrors.BharosaError("message", { cause: new Error("cause") });
const legacyValidationError: typeof PreviousErrors.ValidationError =
  CurrentErrors.ValidationError;
new legacyValidationError();
new CurrentErrors.ValidationError();
new CurrentErrors.ValidationError("message");
new CurrentErrors.ValidationError("message", { cause: new Error("cause") });
const legacyAPIError: typeof PreviousErrors.APIError = CurrentErrors.APIError;
new legacyAPIError();
new CurrentErrors.APIError();
new CurrentErrors.APIError("message");
new CurrentErrors.APIError("message", { cause: new Error("cause") });
const legacyTransportError: typeof PreviousErrors.TransportError =
  CurrentErrors.TransportError;
new legacyTransportError();
new CurrentErrors.TransportError();
new CurrentErrors.TransportError("message");
new CurrentErrors.TransportError("message", { cause: new Error("cause") });
const legacyTimeoutError: typeof PreviousErrors.TimeoutError =
  CurrentErrors.TimeoutError;
new legacyTimeoutError();
new CurrentErrors.TimeoutError();
new CurrentErrors.TimeoutError("message");
new CurrentErrors.TimeoutError("message", { cause: new Error("cause") });
const legacyAbortError: typeof PreviousErrors.AbortError =
  CurrentErrors.AbortError;
new legacyAbortError();
new CurrentErrors.AbortError();
new CurrentErrors.AbortError("message");
new CurrentErrors.AbortError("message", { cause: new Error("cause") });
const legacyInvalidResponseError: typeof PreviousErrors.InvalidResponseError =
  CurrentErrors.InvalidResponseError;
new legacyInvalidResponseError();
new CurrentErrors.InvalidResponseError();
new CurrentErrors.InvalidResponseError("message");
new CurrentErrors.InvalidResponseError("message", {
  cause: new Error("cause"),
});

// Units-first snapshots intentionally introduce nullable valuations; old amount inputs remain accepted.
declare const legacyCreation: Parameters<Previous["portfolios"]["create"]>[0];
const acceptedCreation: Parameters<Current["portfolios"]["create"]>[0] =
  legacyCreation;
declare const legacyReplacement: Parameters<
  Previous["portfolios"]["snapshots"]["create"]
>[1];
const acceptedReplacement: Parameters<
  Current["portfolios"]["snapshots"]["create"]
>[1] = legacyReplacement;
const preservedInMemory: Previous["portfolios"]["fromPositions"] =
  current.portfolios.fromPositions;
void acceptedCreation;
void acceptedReplacement;
void preservedInMemory;
