import assert from "node:assert/strict";
export function mustFind<T>(
  values: readonly T[],
  predicate: (value: T) => boolean,
): T {
  const value = values.find(predicate);
  assert.notEqual(value, undefined);
  assert.ok(value !== undefined);
  return value;
}
export function object(value: unknown): Record<string, unknown> {
  assert.ok(
    value !== null && typeof value === "object" && !Array.isArray(value),
  );
  return value as Record<string, unknown>;
}
/** Deliberately exercises JavaScript/untyped callers, including invalid inputs. */
export function invokeUntyped(
  target: unknown,
  path: readonly string[],
  args: unknown[],
): unknown {
  let receiver = target;
  for (const key of path.slice(0, -1)) {
    assert.ok(
      receiver !== null &&
        (typeof receiver === "object" || typeof receiver === "function"),
    );
    receiver = Reflect.get(receiver, key);
  }
  assert.ok(
    receiver !== null &&
      (typeof receiver === "object" || typeof receiver === "function"),
  );
  const name = path.at(-1);
  assert.ok(name);
  const fn: unknown = Reflect.get(receiver, name);
  assert.ok(typeof fn === "function");
  return Reflect.apply(fn, receiver, args);
}
export type RecordedRequest = {
  url: string;
  init: RequestInit & { headers: Record<string, string>; body?: string };
};
export function capture(
  url: RequestInfo | URL,
  init: RequestInit | undefined,
): RecordedRequest {
  assert.equal(typeof url, "string");
  assert.ok(typeof url === "string");
  assert.ok(init);
  const headers = Object.fromEntries(new Headers(init.headers).entries());
  // Preserve exact case assertions separately through a case-insensitive Headers object where used.
  assert.ok(init.body === undefined || typeof init.body === "string");
  return { url, init: { ...init, headers, body: init.body } };
}

export type MockRequest = RequestInit & {
  headers: Record<string, string>;
  body?: string;
};
export function mockFetch(
  fn: (url: string, init: MockRequest) => Promise<Response>,
): typeof fetch {
  return async (url, init) => {
    assert.ok(typeof url === "string");
    assert.ok(init);
    const h = object(init.headers);
    for (const value of Object.values(h)) assert.ok(typeof value === "string");
    // SDK requests always provide an object header map. Keep casing for wire assertions.
    const headers = h as Record<string, string>;
    assert.ok(init.body === undefined || typeof init.body === "string");
    return fn(url, { ...init, headers, body: init.body });
  };
}

export function parseBody(request: RequestInit): unknown {
  assert.equal(typeof request.body, "string");
  assert.ok(typeof request.body === "string");
  return JSON.parse(request.body);
}
export async function invokeAsync(
  target: unknown,
  path: readonly string[],
  args: unknown[],
): Promise<unknown> {
  return invokeUntyped(target, path, args);
}

export function array(value: unknown): unknown[] {
  assert.ok(Array.isArray(value));
  return value;
}
