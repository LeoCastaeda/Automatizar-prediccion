import { prisma } from "./prisma.js";
import { getSimplePrice } from "./coingecko.service.js";
import { sendEmail, sendTelegram } from "./notify.service.js";
import { AlertType } from "./types/alert.js";

export async function runPriceChecker() {
  const active = await prisma.alert.findMany({ where: { isActive: true }, include: { user: true } });
  if (active.length === 0) return;

  const byCurrency: Record<string, string[]> = {};
  for (const a of active) {
    byCurrency[a.currency] ??= [];
    if (!byCurrency[a.currency].includes(a.symbol)) byCurrency[a.currency].push(a.symbol);
  }

  for (const [currency, symbols] of Object.entries(byCurrency)) {
    const prices = await getSimplePrice(symbols, currency); // { bitcoin: { eur: 60000 } }

    for (const alert of active.filter(a => a.currency === currency)) {
      const p = prices[alert.symbol]?.[currency];
      if (typeof p !== "number") continue;

      let shouldTrigger = false;
      let message = "";

      if (alert.type === AlertType.PRICE && alert.targetValue != null) {
        shouldTrigger = (p <= alert.targetValue) || (p >= alert.targetValue);
        message = `Precio actual de ${alert.symbol} en ${currency.toUpperCase()}: ${p}. Objetivo: ${alert.targetValue}`;
      } else if (alert.type === AlertType.CHANGE_PERCENT && alert.percentage != null) {
        // Para implementar: almacenar precio base en el modelo y comparar
        continue;
      }

      if (shouldTrigger) {
        const title = `ALERTA ${alert.symbol.toUpperCase()} — ${currency.toUpperCase()}`;
        if (alert.user?.email) {
          await sendEmail(alert.user.email, title, `<p>${message}</p>`).catch(() => {});
        }
        await sendTelegram(`${title}: ${message}`).catch(() => {});

        await prisma.alert.update({ where: { id: alert.id }, data: { isActive: false, lastTriggeredAt: new Date() } });
      }
    }
  }
}
