import { createHmac, timingSafeEqual } from "node:crypto";
const panelSessionCookie = "panel_session";
const panelSessionLifetimeMs = 8 * 60 * 60 * 1000;
export function getRequestAuthToken(req) {
    const headerKey = req.header("x-api-key")?.trim();
    if (headerKey)
        return headerKey;
    const authorizationHeader = req.header("authorization")?.trim();
    if (!authorizationHeader)
        return null;
    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) {
        return token.trim();
    }
    return null;
}
export function isValidApiKey(candidate) {
    const configuredKey = (process.env.API_KEY ?? "").trim();
    return Boolean(configuredKey) && Boolean(candidate) && candidate === configuredKey;
}
export function apiKeyGuard(req, res, next) {
    if (req.path === "/health" && req.method === "GET") {
        return next();
    }
    const token = getRequestAuthToken(req);
    if (!isValidApiKey(token)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}
export function requireAuth(req, res, next) {
    return apiKeyGuard(req, res, next);
}
function signPanelSession(expiresAt, key) {
    return createHmac("sha256", key).update(`panel:${expiresAt}`).digest("hex");
}
export function issuePanelSession(_req, res, next) {
    const key = (process.env.API_KEY ?? "").trim();
    if (!key)
        return next();
    const expiresAt = Date.now() + panelSessionLifetimeMs;
    const value = `${expiresAt}.${signPanelSession(expiresAt, key)}`;
    const forwardedProtocol = _req.header("x-forwarded-proto")?.split(",")[0]?.trim();
    res.cookie(panelSessionCookie, value, {
        httpOnly: true,
        secure: _req.secure || forwardedProtocol === "https",
        sameSite: "strict",
        path: "/internal",
        maxAge: panelSessionLifetimeMs
    });
    next();
}
function hasValidPanelSession(req) {
    const key = (process.env.API_KEY ?? "").trim();
    if (!key)
        return false;
    const cookieHeader = req.header("cookie") ?? "";
    const cookie = cookieHeader.split(";").map(value => value.trim())
        .find(value => value.startsWith(`${panelSessionCookie}=`));
    const token = cookie?.slice(panelSessionCookie.length + 1);
    const [expiresAtText, signature] = token?.split(".") ?? [];
    const expiresAt = Number(expiresAtText);
    if (!signature || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now())
        return false;
    const expected = Buffer.from(signPanelSession(expiresAt, key), "hex");
    const provided = Buffer.from(signature, "hex");
    return provided.length === expected.length && timingSafeEqual(provided, expected);
}
export function panelSessionGuard(req, res, next) {
    const fetchSite = req.header("sec-fetch-site");
    const origin = req.header("origin");
    const host = req.header("host");
    let sameOrigin = fetchSite === "same-origin";
    if (origin && host) {
        try {
            sameOrigin = new URL(origin).host.toLowerCase() === host.toLowerCase()
                && (!fetchSite || fetchSite === "same-origin");
        }
        catch {
            sameOrigin = false;
        }
    }
    if (!sameOrigin || !hasValidPanelSession(req)) {
        return res.status(403).json({ error: "Panel no disponible. Recarga la página." });
    }
    next();
}
