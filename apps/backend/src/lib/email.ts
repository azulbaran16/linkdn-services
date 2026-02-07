import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 2525;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM = process.env.SMTP_FROM || 'noreply@linkdn-services.co';

const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      ...(SMTP_USER && SMTP_PASS
        ? { auth: { user: SMTP_USER, pass: SMTP_PASS } }
        : {}),
    })
  : null;

export async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    console.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL-DEV] (SMTP not configured — set SMTP_HOST to enable)`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"LinkDN Services" <${FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err);
    throw err;
  }
}
