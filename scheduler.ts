import { runPriceChecker } from "./priceChecker.js";

let schedulerTimer: NodeJS.Timeout | null = null;

export function startAlertScheduler(intervalMs = 60_000): NodeJS.Timeout {
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

export function stopAlertScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
