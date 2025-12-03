import { Resend } from 'resend';

const { RESEND_API_KEY, SMTP_FROM } = process.env;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendMail({ to, subject, text, html }) {
  if (!resend || !SMTP_FROM) {
    console.warn('Mailer not configured: missing RESEND_API_KEY or SMTP_FROM');
    return { ok: false, reason: 'not_configured' };
  }

  const { data, error } = await resend.emails.send({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html
  });

  if (error) throw error;
  return { ok: true, messageId: data.id };
}
