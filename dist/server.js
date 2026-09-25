import "./env.js";
import express from "express";
import { ENV, resolveAvailablePort } from "./env.js";
import pricesRoute from "./prices.route.js";
import alertsRoute from "./alerts.route.js";
import usersRoute from "./users.route.js";
import { apiKeyGuard } from "./auth.js";
import { HttpError } from "./errors.js";
import { historicalRouter } from "./historical.route.js";
import { startAlertScheduler } from "./scheduler.js";
const app = express();
app.use(express.json());
// Serve static files from public directory
app.use(express.static("public"));
// Salud
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
// Guard sencillo por API key
app.use("/api", apiKeyGuard);
app.use("/api/prices", pricesRoute);
app.use("/api/historical", historicalRouter);
app.use("/api/alerts", alertsRoute);
app.use("/api/users", usersRoute);
// Manejo de errores
app.use((err, _req, res, _next) => {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    res.status(status).json({ error: message });
});
async function startServer() {
    const port = await resolveAvailablePort(ENV.PORT);
    app.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
    });
}
startServer().catch((error) => {
    console.error("Unable to start server:", error);
    process.exit(1);
});
startAlertScheduler(60_000);
