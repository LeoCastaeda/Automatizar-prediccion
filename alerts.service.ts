import { prisma } from "../config/prisma.js";
import { AlertType } from "@prisma/client";

export async function createAlert(params: {
  userId: number;
  symbol: string;
  currency: string;
  type: AlertType;
  targetValue?: number;
  percentage?: number;
}) {
  return prisma.alert.create({ data: params });
}

export async function listAlerts(userId?: number) {
  return prisma.alert.findMany({ where: { isActive: true, ...(userId ? { userId } : {}) } });
}

export async function deactivateAlert(id: number) {
  return prisma.alert.update({ where: { id }, data: { isActive: false, lastTriggeredAt: new Date() } });
}
