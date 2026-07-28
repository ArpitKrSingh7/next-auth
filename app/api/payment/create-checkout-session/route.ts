import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "../../../lib/auth";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRICE_ID;
const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY is missing --- Payment won't work");
}

if (!priceId) {
  console.warn("STRIPE_PRICE_ID is missing --- Payment won't work");
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  const userId = session.user.id;

  try {
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout?success=true`,
      cancel_url: `${appUrl}/checkout?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    });

    if (!stripeSession.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
