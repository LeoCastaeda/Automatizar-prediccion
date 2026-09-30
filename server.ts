import "./env.js";
import express, { Request, Response, NextFunction } from "express";
import { resolve } from "node:path";
import serverless from "serverless-http";
import { ENV, resolveAvailablePort } from "./env.js";
import pricesRoute from "./prices.route.js";
import alertsRoute from "./alerts.route.js";
import usersRoute from "./users.route.js";
import { apiKeyGuard, issuePanelSession, panelSessionGuard } from "./auth.js";
import { HttpError } from "./errors.js";
import { historicalRouter } from "./historical.route.js";
import { startAlertScheduler } from "./scheduler.js";

const app = express();
app.use(express.json());

app.get("/", issuePanelSession, (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(resolve("public/index.html"));
});

// Serve static files from public directory
app.use(express.static("public"));

// Salud
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Guard sencillo por API key
app.use("/api", apiKeyGuard);
app.use("/api/prices", pricesRoute);
app.use("/api/historical", historicalRouter);
app.use("/api/alerts", alertsRoute);
app.use("/api/users", usersRoute);

app.use("/internal", panelSessionGuard);
app.use("/internal/prices", pricesRoute);
app.use("/internal/historical", historicalRouter);
app.use("/internal/alerts", alertsRoute);
app.use("/internal/users", usersRoute);

// Manejo de errores
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message =
    err instanceof Error ? err.message : "Internal Server Error";

  res.status(status).json({ error: message });
});

async function startServer() {
  const preferredPort = Number(process.env.PORT || ENV.PORT || 3000);
  const port = await resolveAvailablePort(preferredPort);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

export const handler = serverless(app);

if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer().catch((error) => {
    console.error("Unable to start server:", error);
    process.exit(1);
  });

  startAlertScheduler(60_000);
}

export default handler;
