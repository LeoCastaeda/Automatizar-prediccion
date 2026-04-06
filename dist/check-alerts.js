import { prisma } from "./prisma.js";
async function checkAlerts() {
    const alerts = await prisma.alert.findMany({
        where: { isActive: true },
        select: {
            id: true,
            userId: true,
            symbol: true,
            type: true,
            targetValue: true,
            percentage: true,
        },
    });
    console.log("Active alerts in database:");
    console.table(alerts);
    await prisma.$disconnect();
}
checkAlerts().catch(console.error);
