import dotenv from "dotenv";
dotenv.config();
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
        TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        CHAT_ID: process.env.TELEGRAM_CHAT_ID || ""
    }
};
