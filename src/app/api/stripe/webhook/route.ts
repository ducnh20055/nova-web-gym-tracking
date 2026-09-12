import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const signature = (await headers()).get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret)
    return new NextResponse("Invalid webhook", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (userId && subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          update: {
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : null,
            plan: session.metadata?.plan || "pro",
            status: subscription.status,
            currentPeriodEnd: new Date(
              subscription.items.data[0].current_period_end * 1000,
            ),
          },
          create: {
            userId,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : null,
            stripeSubscriptionId: subscription.id,
            plan: session.metadata?.plan || "pro",
            status: subscription.status,
            currentPeriodEnd: new Date(
              subscription.items.data[0].current_period_end * 1000,
            ),
          },
        });
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status,
          currentPeriodEnd: new Date(
            subscription.items.data[0].current_period_end * 1000,
          ),
        },
      });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_ERROR]", error);
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}
