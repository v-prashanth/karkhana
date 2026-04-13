import nodemailer from "nodemailer";

function getMailerEnv() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;
  const fromName = process.env.SMTP_FROM_NAME || "Karkhana";

  if (!host || !port || !user || !pass || !fromEmail) {
    throw new Error("Email delivery is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM_EMAIL.");
  }

  return {
    host,
    port: Number(port),
    user,
    pass,
    fromEmail,
    fromName,
  };
}

function createTransporter() {
  const env = getMailerEnv();

  return nodemailer.createTransport({
    host: env.host,
    port: env.port,
    secure: env.port === 465,
    auth: {
      user: env.user,
      pass: env.pass,
    },
  });
}

export async function sendAuthEmail(input: {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  code?: string;
}) {
  const env = getMailerEnv();
  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; background:#f7f3ee; padding:32px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:20px; padding:32px; border:1px solid #ece5dc;">
        <div style="margin-bottom:24px;">
          <div style="display:inline-block; background:#ff7a1a; color:#ffffff; font-weight:700; padding:10px 14px; border-radius:14px;">Karkhana</div>
        </div>
        <h1 style="margin:0 0 12px; font-size:28px; color:#171717;">${input.heading}</h1>
        <p style="margin:0 0 20px; font-size:15px; line-height:1.7; color:#4b5563;">${input.body}</p>
        ${input.code ? `<div style="margin:24px 0; padding:18px; border-radius:16px; background:#171717; color:#ffffff; font-size:30px; font-weight:700; letter-spacing:8px; text-align:center;">${input.code}</div>` : ""}
        ${input.ctaLabel && input.ctaUrl ? `<a href="${input.ctaUrl}" style="display:inline-block; margin-top:8px; background:#ff7a1a; color:#ffffff; text-decoration:none; padding:14px 20px; border-radius:14px; font-weight:700;">${input.ctaLabel}</a>` : ""}
        <p style="margin:28px 0 0; font-size:12px; line-height:1.6; color:#6b7280;">If you did not request this email, you can ignore it safely.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${env.fromName}" <${env.fromEmail}>`,
    to: input.to,
    subject: input.subject,
    html,
  });
}
