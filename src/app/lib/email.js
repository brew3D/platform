import nodemailer from 'nodemailer';

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@example.com';

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  cachedTransporter.defaults = { from };
  return cachedTransporter;
}

export async function sendPasswordResetEmail({ to, otp, expiresMinutes = 10 }) {
  const transporter = getTransporter();
  const subject = 'Your password reset code';
  const text = `Use this code to reset your password: ${otp}\n\nThis code expires in ${expiresMinutes} minutes.`;
  const html = `<p>Use this code to reset your password:</p><h2 style="margin:0 0 12px 0;">${otp}</h2><p>This code expires in ${expiresMinutes} minutes.</p>`;

  await transporter.sendMail({ to, subject, text, html });
}


