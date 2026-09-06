import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { eventId, attendeeName, attendeeEmail, orgSlug } = await request.json();

  if (!eventId || !orgSlug) {
    return NextResponse.json({ error: "Missing event." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, title, price, visibility, status")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || event.visibility !== "public" || event.status !== "confirmed") {
    return NextResponse.json(
      { error: "This event isn't open for registration." },
      { status: 400 }
    );
  }

  const cents = Math.round(Number(event.price) * 100);
  if (!Number.isFinite(cents) || cents < 50) {
    return NextResponse.json({ error: "This event doesn't require payment." }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Event registration — ${event.title}` },
          unit_amount: cents,
        },
        quantity: 1,
      },
    ],
    customer_email: attendeeEmail || undefined,
    metadata: {
      kind: "event_registration",
      event_id: eventId,
      attendee_name: attendeeName ?? "",
    },
    success_url: `${origin}/${orgSlug}/events?registered=1`,
    cancel_url: `${origin}/${orgSlug}/events`,
  });

  return NextResponse.json({ url: session.url });
}
