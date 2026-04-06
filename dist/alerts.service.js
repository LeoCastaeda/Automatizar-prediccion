import { prisma } from "./prisma.js";
import { getSimplePrice } from "./coingecko.service.js";
export async function createAlert(params) {
    // Get current price
    let initialPrice = null;
    try {
        const prices = await getSimplePrice([params.symbol], params.currency);
        initialPrice = prices[params.symbol]?.[params.currency] ?? null;
    }
    catch (error) {
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
export async function listAlerts(userId) {
    return prisma.alert.findMany({ where: { isActive: true, ...(userId ? { userId } : {}) } });
}
export async function deactivateAlert(id) {
    return prisma.alert.update({ where: { id }, data: { isActive: false, lastTriggeredAt: new Date() } });
}
