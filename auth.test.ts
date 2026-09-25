import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { apiKeyGuard, getRequestAuthToken, isValidApiKey } from "./auth.js";

function makeRequest(headers: Record<string, string> = {}, path = "/api/prices", method = "GET") {
  return {
    method,
    path,
    header: (name: string) => headers[name.toLowerCase()] ?? headers[name] ?? undefined,
  } as any;
}

function makeResponse() {
  const res: any = {
    code: undefined,
    payload: undefined,
  };

  res.status = (statusCode: number) => {
    res.code = statusCode;
    return res;
  };

  res.json = (payload: unknown) => {
    res.payload = payload;
    return res;
  };

  return res;
}

describe("auth middleware", () => {
  beforeEach(() => {
    process.env.API_KEY = "secret-key";
  });

  afterEach(() => {
    delete process.env.API_KEY;
  });

  it("reads a valid x-api-key header", () => {
    const token = getRequestAuthToken(makeRequest({ "x-api-key": "secret-key" }));
    expect(token).toBe("secret-key");
  });

  it("accepts a valid bearer token", () => {
    let nextCalled = false;
    const req = makeRequest({ authorization: "Bearer secret-key" });
    const res = makeResponse();

    apiKeyGuard(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(res.code).toBeUndefined();
  });

  it("rejects unauthorized requests", () => {
    let nextCalled = false;
    const req = makeRequest({ "x-api-key": "wrong-key" });
    const res = makeResponse();

    apiKeyGuard(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(res.code).toBe(401);
    expect(res.payload).toEqual({ error: "Unauthorized" });
  });

  it("validates API keys against the configured environment key", () => {
    expect(isValidApiKey("secret-key")).toBe(true);
    expect(isValidApiKey("other-key")).toBe(false);
    expect(isValidApiKey(null)).toBe(false);
  });
});
