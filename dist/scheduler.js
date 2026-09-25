import { runPriceChecker } from "./priceChecker.js";
let schedulerTimer = null;
export function startAlertScheduler(intervalMs = 60_000) {
    if (schedulerTimer) {
        return schedulerTimer;
    }
    schedulerTimer = setInterval(() => {
        runPriceChecker().catch((error) => {
            console.error("Alert scheduler failed:", error);
        });
    }, intervalMs);
    return schedulerTimer;
}
export function stopAlertScheduler() {
    if (schedulerTimer) {
        clearInterval(schedulerTimer);
        schedulerTimer = null;
    }
}
