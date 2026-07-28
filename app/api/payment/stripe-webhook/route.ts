import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "../../../../lib/prisma";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY is missing");
}

if (!endpointSecret) {
  console.warn("STRIPE_WEBHOOK_SECRET is missing");
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  if (!endpointSecret) {
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 500 },
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", errorMessage);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${errorMessage}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const subscriptionId = session.subscription as string | undefined;
      const customerId = session.customer as string | undefined;

      if (!userId) {
        console.error("No userId found in checkout session", session.id);
        return NextResponse.json(
          { error: "No userId found in checkout session" },
          { status: 400 },
        );
      }

      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            premiumAt: new Date(),
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          },
        });
        console.log(`User ${userId} upgraded to premium`);
      } catch (err) {
        console.error("Failed to activate premium for user:", userId, err);
        return NextResponse.json(
          { error: "Failed to activate premium" },
          { status: 500 },
        );
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
