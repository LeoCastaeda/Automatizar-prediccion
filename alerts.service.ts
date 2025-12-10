import { prisma } from "./prisma.js";
import { AlertType } from "./types.js";
import { getSimplePrice } from "./coingecko.service.js";

export async function createAlert(params: {
  userId: number;
  symbol: string;
  currency: string;
  type: AlertType;
  targetValue?: number;
  percentage?: number;
}) {
  // Get current price
  let initialPrice: number | null = null;
  try {
    const prices = await getSimplePrice([params.symbol], params.currency);
    initialPrice = prices[params.symbol]?.[params.currency] ?? null;
  } catch (error) {
    console.error("Failed to get initial price, continuing without it:", error instanceof Error ? error.message : error);
    // Continue without initial price - alert will still be created
  }

  return prisma.alert.create({
    data: {
      userId: params.userId,
      symbol: params.symbol,
      currency: params.currency,
      type: params.type,
      targetValue: params.targetValue ?? null,
      percentage: params.percentage ?? null,
      initialPrice,
    },
  });
}

export async function listAlerts(userId?: number) {
  return prisma.alert.findMany({ where: { isActive: true, ...(userId ? { userId } : {}) } });
}

export async function deactivateAlert(id: number) {
  return prisma.alert.update({ where: { id }, data: { isActive: false, lastTriggeredAt: new Date() } });
}
