import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { apiKeyGuard, getRequestAuthToken, isValidApiKey, issuePanelSession, panelSessionGuard } from "./auth.js";

function makeRequest(headers: Record<string, string> = {}, path = "/api/prices", method = "GET") {
  return {
    method,
    path,
    header: (name: string) => headers[name.toLowerCase()] ?? headers[name] ?? undefined,
    secure: false,
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

  res.cookie = (name: string, value: string, options: unknown) => {
    res.cookieValue = value;
    res.cookieOptions = options;
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

  it("issues an HttpOnly panel session and accepts it only from the same origin", () => {
    const issueResponse = makeResponse();
    issuePanelSession(makeRequest({ "x-forwarded-proto": "https" }), issueResponse, () => {});

    expect(issueResponse.cookieOptions).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/internal"
    });
    expect(issueResponse.cookieValue).not.toContain("secret-key");

    let nextCalled = false;
    const sameOriginRequest = makeRequest({
      cookie: `panel_session=${issueResponse.cookieValue}`,
      origin: "https://panel.example",
      host: "panel.example",
      "sec-fetch-site": "same-origin"
    });
    panelSessionGuard(sameOriginRequest, makeResponse(), () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);

    const crossOriginResponse = makeResponse();
    panelSessionGuard(makeRequest({
      cookie: `panel_session=${issueResponse.cookieValue}`,
      origin: "https://other.example",
      host: "panel.example",
      "sec-fetch-site": "same-origin"
    }), crossOriginResponse, () => {});
    expect(crossOriginResponse.code).toBe(403);
  });
});
