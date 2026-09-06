import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const phaseId = session.metadata?.phase_id;
    const projectId = session.metadata?.project_id;

    if (phaseId && projectId) {
      const supabase = createAdminClient();

      const { data: phase } = await supabase
        .from("phases")
        .select("org_id")
        .eq("id", phaseId)
        .maybeSingle();

      if (phase) {
        await supabase.from("donations").insert({
          phase_id: phaseId,
          project_id: projectId,
          org_id: phase.org_id,
          amount: (session.amount_total ?? 0) / 100,
          donor_email: session.customer_details?.email ?? null,
          stripe_payment_id: session.id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
