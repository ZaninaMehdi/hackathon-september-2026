import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, donationReceiptEmail, eventRegistrationEmail } from "@/lib/services/email";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature or secret." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = createAdminClient();

    if (session.metadata?.kind === "event_registration") {
      const eventId = session.metadata?.event_id;

      if (eventId) {
        const { data: eventRow } = await supabase
          .from("events")
          .select("org_id, title, organizations(name)")
          .eq("id", eventId)
          .maybeSingle();

        if (eventRow) {
          const attendeeEmail = session.customer_details?.email ?? null;
          const amount = (session.amount_total ?? 0) / 100;

          const { error } = await supabase.from("event_registrations").insert({
            event_id: eventId,
            org_id: eventRow.org_id,
            attendee_name: session.metadata?.attendee_name || null,
            attendee_email: attendeeEmail,
            amount_paid: amount,
            stripe_payment_id: session.id,
          });

          if (!error && attendeeEmail) {
            const org = Array.isArray(eventRow.organizations)
              ? eventRow.organizations[0]
              : eventRow.organizations;
            const { subject, html } = eventRegistrationEmail({
              orgName: org?.name ?? "Amanah",
              amount,
              eventTitle: eventRow.title,
              date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            });
            await sendEmail({ to: attendeeEmail, subject, html });
          }
        }
      }
    } else {
      const phaseId = session.metadata?.phase_id;
      const projectId = session.metadata?.project_id;

      if (phaseId && projectId) {
        const { data: phase } = await supabase
          .from("phases")
          .select("org_id, title, organizations(name), projects(title)")
          .eq("id", phaseId)
          .maybeSingle();

        if (phase) {
          const donorEmail = session.customer_details?.email ?? null;
          const amount = (session.amount_total ?? 0) / 100;

          const { error } = await supabase.from("donations").insert({
            phase_id: phaseId,
            project_id: projectId,
            org_id: phase.org_id,
            amount,
            donor_email: donorEmail,
            stripe_payment_id: session.id,
          });

          if (!error && donorEmail) {
            const org = Array.isArray(phase.organizations) ? phase.organizations[0] : phase.organizations;
            const project = Array.isArray(phase.projects) ? phase.projects[0] : phase.projects;
            const { subject, html } = donationReceiptEmail({
              orgName: org?.name ?? "Amanah",
              amount,
              campaignTitle: project?.title ?? "your campaign",
              phaseLabel: phase.title,
              date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            });
            await sendEmail({ to: donorEmail, subject, html });
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
