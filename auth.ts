import { Request, Response, NextFunction } from "express";

export function getRequestAuthToken(req: Request): string | null {
  const headerKey = req.header("x-api-key")?.trim();
  if (headerKey) return headerKey;

  const authorizationHeader = req.header("authorization")?.trim();
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) {
    return token.trim();
  }

  return null;
}

export function isValidApiKey(candidate: string | null | undefined): boolean {
  const configuredKey = (process.env.API_KEY ?? "").trim();
  return Boolean(configuredKey) && Boolean(candidate) && candidate === configuredKey;
}

export function apiKeyGuard(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/health" && req.method === "GET") {
    return next();
  }

  const token = getRequestAuthToken(req);
  if (!isValidApiKey(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  return apiKeyGuard(req, res, next);
}
