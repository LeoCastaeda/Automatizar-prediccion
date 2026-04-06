export function apiKeyGuard(req, res, next) {
    const apiKeyHeader = req.header("x-api-key");
    const valid = process.env.API_KEY;
    if (!valid || apiKeyHeader !== valid) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}
