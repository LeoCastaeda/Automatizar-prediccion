import dotenv from "dotenv";
import net from "node:net";

dotenv.config();

export async function resolveAvailablePort(preferredPort: number): Promise<number> {
  const startPort = Number.isFinite(preferredPort) && preferredPort > 0 ? preferredPort : 0;

  return await new Promise((resolve, reject) => {
    const tester = net.createServer();

    const tryPort = (port: number) => {
      tester.once("error", (error: NodeJS.ErrnoException) => {
        if ((error.code === "EADDRINUSE" || error.code === "EACCES") && port < 65535) {
          tryPort(port + 1);
          return;
        }

        if (error.code === "EADDRINUSE" && port >= 65535) {
          reject(new Error("No available port found in range 0-65535."));
          return;
        }

        reject(error);
      });

      tester.once("listening", () => {
        const address = tester.address();
        const portNumber = typeof address === "object" && address ? address.port : port;

        tester.close(() => resolve(portNumber));
      });

      tester.listen(port, "0.0.0.0");
    };

    tryPort(startPort);
  });
}

export const ENV = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  API_KEY: process.env.API_KEY || "",
  SMTP: {
    HOST: process.env.SMTP_HOST || "",
    PORT: parseInt(process.env.SMTP_PORT || "587", 10),
    USER: process.env.SMTP_USER || "",
    PASS: process.env.SMTP_PASS || "",
    FROM: process.env.SMTP_FROM || "Crypto Alerts <no-reply@example.com>"
  },
  TELEGRAM: {
    TOKEN: process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN || "",
    CHAT_ID: process.env.TELEGRAM_CHAT_ID || ""
  }
};
