import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { amount, phaseId, phaseLabel, projectId, projectSlug, orgSlug } = await request.json();

  const cents = Math.round(Number(amount) * 100);
  if (!Number.isFinite(cents) || cents < 100) {
    return NextResponse.json({ error: "Enter an amount of at least $1." }, { status: 400 });
  }
  if (!phaseId || !projectId || !projectSlug || !orgSlug) {
    return NextResponse.json({ error: "Missing phase or project." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.status !== "active") {
    return NextResponse.json(
      { error: "This project is not accepting donations right now." },
      { status: 400 }
    );
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Donation — ${phaseLabel}` },
          unit_amount: cents,
        },
        quantity: 1,
      },
    ],
    metadata: { phase_id: phaseId, project_id: projectId },
    success_url: `${origin}/${orgSlug}/${projectSlug}?donated=1`,
    cancel_url: `${origin}/${orgSlug}/${projectSlug}`,
  });

  return NextResponse.json({ url: session.url });
}
