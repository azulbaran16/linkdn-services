import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: false,
});

const FROM = process.env.SMTP_FROM || 'noreply@linkdn-services.co';

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: `"LinkDN Services" <${FROM}>`,
    to,
    subject,
    html,
  });
}
