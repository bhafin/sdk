import { test } from "node:test";
import assert from "node:assert/strict";
import { valid } from "../dist/validate.cjs";

test("date-time rejects calendar normalization and out-of-range wall-clock components", () => {
  for (const value of [
    "2026-02-30T12:00:00Z",
    "2026-02-29T12:00:00Z",
    "2026-04-31T12:00:00Z",
    "1900-02-29T12:00:00Z",
    "2026-10-01T24:00:00Z",
    "2026-10-01T12:60:00Z",
    "2026-10-01T12:00:60Z",
    "2026-00-01T12:00:00Z",
    "2026-13-01T12:00:00Z",
    "2026-10-00T12:00:00Z",
    "2026-10-01T12:00:00+24:00",
    "2026-10-01T12:00:00+05:60",
  ])
    assert.equal(
      valid({ type: "string", format: "date-time" }, value),
      false,
      value,
    );
});
test("date-time preserves leap days, fractional seconds and timezone offsets", () => {
  for (const value of [
    "2024-02-29T12:00:00Z",
    "2000-02-29T12:00:00Z",
    "2026-10-01T12:00:00Z",
    "2026-10-01T12:00:00.123456Z",
    "2026-10-01T00:00:00+05:30",
    "2026-10-01T23:59:59-04:00",
    "2026-10-01T00:00:00+00:00",
  ])
    assert.equal(
      valid({ type: "string", format: "date-time" }, value),
      true,
      value,
    );
});
