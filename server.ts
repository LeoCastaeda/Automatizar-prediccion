import "./config/env.js";
import express from "express";
import { ENV } from "./config/env.js";
import pricesRoute from "./routes/prices.route.js";
import alertsRoute from "./routes/alerts.route.js";
import { apiKeyGuard } from "./utils/auth.js";
import { HttpError } from "./utils/errors.js";
import { runPriceChecker } from "./jobs/priceChecker.js";

const app = express();
app.use(express.json());

// Salud
app.get("/health", (_req, res) => res.json({ ok: true }));

// Guard sencillo por API key
app.use("/api", apiKeyGuard);
app.use("/api/prices", pricesRoute);
app.use("/api/alerts", alertsRoute);

// Manejo de errores
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err?.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

app.listen(ENV.PORT, () => {
  console.log(`Server listening on http://localhost:${ENV.PORT}`);
});

// Job en intervalo (cada 60s). En producción, usa un scheduler/cron real.
setInterval(() => {
  runPriceChecker().catch(() => {});
}, 60_000);
