import nodemailer from "nodemailer";
import { ENV } from "./env.js";
export async function sendEmail(to, subject, html) {
    const transporter = nodemailer.createTransport({
        host: ENV.SMTP.HOST,
        port: ENV.SMTP.PORT,
        secure: ENV.SMTP.PORT === 465,
        auth: { user: ENV.SMTP.USER, pass: ENV.SMTP.PASS }
    });
    await transporter.sendMail({ from: ENV.SMTP.FROM, to, subject, html });
}
export async function sendTelegram(text) {
    if (!ENV.TELEGRAM.TOKEN || !ENV.TELEGRAM.CHAT_ID)
        return;
    const url = `https://api.telegram.org/bot${ENV.TELEGRAM.TOKEN}/sendMessage`;
    // Node 18+ global fetch
    await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: ENV.TELEGRAM.CHAT_ID, text })
    });
}
