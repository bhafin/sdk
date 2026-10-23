import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BharosaError,
  ValidationError,
  APIError,
  TransportError,
  TimeoutError,
  AbortError,
  InvalidResponseError,
} from "../dist/index.mjs";
const errors = [
  BharosaError,
  ValidationError,
  APIError,
  TransportError,
  TimeoutError,
  AbortError,
  InvalidResponseError,
];
for (const Constructor of errors)
  test(`${Constructor.name} preserves all legacy constructor forms`, () => {
    const baseline = Reflect.construct(Constructor, []);
    for (const args of [
      [],
      ["message"],
      ["message", { cause: new Error("cause") }],
    ] as const) {
      const error = Reflect.construct(Constructor, args);
      assert.ok(error instanceof Constructor);
      assert.equal(error.name, Constructor.name);
      assert.equal(error.outcome, "not_sent");
      assert.equal(Object.hasOwn(error, "cause"), false);
      assert.equal(Object.hasOwn(error, "status"), false);
      if (Constructor === BharosaError) {
        assert.equal(error.kind, args[0]);
        assert.equal(error.message, args.length === 2 ? "[object Object]" : "");
        assert.equal(Object.hasOwn(error, "message"), args.length === 2);
      } else {
        assert.equal(error.kind, baseline.kind);
        assert.equal(error.message, baseline.message);
      }
    }
  });
for (const Constructor of [
  APIError,
  TransportError,
  TimeoutError,
  AbortError,
  InvalidResponseError,
])
  test(`${Constructor.name} retains metadata with its fixed diagnostic message`, () => {
    const metadata = {
      status: 409,
      requestId: "req_synthetic",
      code: "conflict",
      param: null,
      type: "invalid_request_error",
      outcome: "rejected" as const,
    };
    const error = new Constructor(metadata);
    for (const [key, value] of Object.entries(metadata))
      assert.equal(Reflect.get(error, key), value);
    assert.equal(error.message, new Constructor().message);
  });
test("base error retains the actual kind/message/metadata signature", () => {
  const error = new BharosaError("api", "diagnostic", {
    status: 422,
    outcome: "rejected",
  });
  assert.equal(error.kind, "api");
  assert.equal(error.message, "diagnostic");
  assert.equal(error.status, 422);
  assert.equal(error.outcome, "rejected");
});

test("metadata getter order and inherited fields retain destructuring behavior", () => {
  const reads: string[] = [];
  const metadata = {};
  Object.setPrototypeOf(metadata, {
    get code() {
      reads.push("code");
      return "inherited";
    },
  });
  for (const field of ["status", "requestId", "param", "type", "outcome"])
    Object.defineProperty(metadata, field, {
      get() {
        reads.push(field);
        return undefined;
      },
    });
  const error = new APIError(metadata);
  assert.deepEqual(reads, [
    "status",
    "requestId",
    "code",
    "param",
    "type",
    "outcome",
  ]);
  assert.equal(error.code, "inherited");
});
