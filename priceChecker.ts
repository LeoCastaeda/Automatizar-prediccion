import { prisma } from "./prisma.js";
import { getSimplePrice } from "./coingecko.service.js";
import { sendEmail, sendTelegram } from "./notify.service.js";
import { AlertType } from "./types/alert.js";

export function evaluateAlert(alert: {
  type: string;
  targetValue?: number | null;
  percentage?: number | null;
  initialPrice?: number | null;
  symbol: string;
  currency: string;
}, currentPrice: number): { shouldTrigger: boolean; message: string } {
  if (alert.type === AlertType.PRICE && alert.targetValue != null) {
    const shouldTrigger = alert.initialPrice == null || alert.initialPrice <= alert.targetValue
      ? currentPrice >= alert.targetValue
      : currentPrice <= alert.targetValue;

    return {
      shouldTrigger,
      message: `Precio actual de ${alert.symbol} en ${alert.currency.toUpperCase()}: ${currentPrice}. Objetivo: ${alert.targetValue}`
    };
  }

  if (alert.type === AlertType.CHANGE_PERCENT && alert.percentage != null) {
    if (alert.initialPrice == null || alert.initialPrice <= 0) {
      return { shouldTrigger: false, message: "Sin precio base disponible" };
    }

    const change = ((currentPrice - alert.initialPrice) / alert.initialPrice) * 100;
    return {
      shouldTrigger: Math.abs(change) >= alert.percentage,
      message: `Precio actual de ${alert.symbol} en ${alert.currency.toUpperCase()}: ${currentPrice}. Variación: ${change.toFixed(2)}%. Objetivo: ±${alert.percentage}%`
    };
  }

  return { shouldTrigger: false, message: "Tipo de alerta no soportado" };
}

export async function runPriceChecker() {
  const active = await prisma.alert.findMany({ where: { isActive: true }, include: { user: true } });
  if (active.length === 0) return;

  const byCurrency: Record<string, string[]> = {};
  for (const alert of active) {
    byCurrency[alert.currency] ??= [];
    if (!byCurrency[alert.currency].includes(alert.symbol)) {
      byCurrency[alert.currency].push(alert.symbol);
    }
  }

  for (const [currency, symbols] of Object.entries(byCurrency)) {
    const prices = await getSimplePrice(symbols, currency);

    for (const alert of active.filter((item) => item.currency === currency)) {
      const currentPrice = prices[alert.symbol]?.[currency];
      if (typeof currentPrice !== "number") {
        continue;
      }

      const { shouldTrigger, message } = evaluateAlert(alert, currentPrice);
      if (!shouldTrigger) {
        continue;
      }

      const title = `ALERTA ${alert.symbol.toUpperCase()} — ${currency.toUpperCase()}`;
      if (alert.user?.email) {
        await sendEmail(alert.user.email, title, `<p>${message}</p>`).catch(() => {});
      }
      await sendTelegram(`${title}: ${message}`).catch(() => {});

      await prisma.alert.update({
        where: { id: alert.id },
        data: { isActive: false, lastTriggeredAt: new Date() }
      });
    }
  }
}
