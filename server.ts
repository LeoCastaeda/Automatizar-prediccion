import "./env";
import express, { Request, Response, NextFunction } from "express";
import { ENV } from "./env";
import pricesRoute from "./prices.route";
import alertsRoute from "./alerts.route";
import usersRoute from "./users.route";
import { apiKeyGuard } from "./auth";
import { HttpError } from "./errors";
import { runPriceChecker } from "./priceChecker";
import { historicalRouter } from "./historical.route";

const app = express();
app.use(express.json());

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

// Manejo de errores
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message =
    err instanceof Error ? err.message : "Internal Server Error";

  res.status(status).json({ error: message });
});

app.listen(ENV.PORT, () => {
  console.log(`Server listening on http://localhost:${ENV.PORT}`);
});

// Job en intervalo (cada 60s). En producción, usa un scheduler/cron real.
setInterval(() => {
  runPriceChecker().catch(() => {});
}, 60_000);
