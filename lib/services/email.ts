import { Resend } from "resend";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

// Mirrors the stubSms pattern in notify.ts: without a real provider key,
// email sends are logged instead of attempted, so donation/registration
// flows never fail just because RESEND_API_KEY isn't configured yet.
export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Amanah <onboarding@resend.dev>";

  if (!apiKey) {
    console.log("[email-stub]", { to: input.to, subject: input.subject });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to: input.to, subject: input.subject, html: input.html });
  } catch (err) {
    // Best-effort: a failed receipt email should never break a completed
    // payment. Log it so it's visible, but don't throw.
    console.error("[email] send failed", err);
  }
}

function baseLayout(orgName: string, body: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #16211a;">
      <div style="padding: 24px 0; border-bottom: 2px solid #2f5d3f;">
        <span style="font-size: 18px; font-weight: 700;">${orgName}</span>
      </div>
      <div style="padding: 24px 0;">${body}</div>
      <div style="padding: 16px 0; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        Sent via Amanah — every donation and expense at ${orgName} is posted publicly for transparency.
      </div>
    </div>
  `;
}

export function donationReceiptEmail(input: {
  orgName: string;
  amount: number;
  campaignTitle: string;
  phaseLabel: string;
  date: string;
}) {
  const amountLabel = input.amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
  return {
    subject: `Thank you for your gift to ${input.campaignTitle}`,
    html: baseLayout(
      input.orgName,
      `
        <p style="font-size: 16px;">Jazak Allah khair for your donation.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #6b7280;">Amount</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${amountLabel}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Campaign</td><td style="padding: 6px 0; text-align: right;">${input.campaignTitle}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Phase</td><td style="padding: 6px 0; text-align: right;">${input.phaseLabel}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Date</td><td style="padding: 6px 0; text-align: right;">${input.date}</td></tr>
        </table>
        <p style="color: #4d5651;">Every expense funded by this campaign is posted publicly with its receipt, so you can follow your gift's impact any time.</p>
      `
    ),
  };
}

export function eventRegistrationEmail(input: {
  orgName: string;
  amount: number;
  eventTitle: string;
  date: string;
}) {
  const amountLabel = input.amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
  return {
    subject: `You're registered for ${input.eventTitle}`,
    html: baseLayout(
      input.orgName,
      `
        <p style="font-size: 16px;">Your registration is confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #6b7280;">Event</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${input.eventTitle}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Amount paid</td><td style="padding: 6px 0; text-align: right;">${amountLabel}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Date</td><td style="padding: 6px 0; text-align: right;">${input.date}</td></tr>
        </table>
        <p style="color: #4d5651;">We look forward to seeing you there.</p>
      `
    ),
  };
}
