import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse("Bạn cần đăng nhập để thực hiện thanh toán", {
        status: 401,
      });
    }

    const { isYearly, planId } = await req.json();

    const isVip = planId === "vip";
    const priceAmount = isVip
      ? isYearly
        ? 4788000
        : 499000
      : isYearly
        ? 1428000
        : 149000;
    const interval = isYearly ? "year" : "month";

    // Tạo phiên Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.emailAddresses[0]?.emailAddress,
      line_items: [
        {
          price_data: {
            currency: "vnd",
            product_data: {
              name: isVip ? "Gói VIP Coach 1-1" : "Gói PRO AI Trainer",
              description:
                "Hỏi đáp AI PT 24/7, phân tích Form, thiết kế giáo án không giới hạn.",
            },
            unit_amount: priceAmount,
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId, // Lưu thông tin ID người dùng từ Clerk
        plan: isVip ? "vip" : "pro",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT_ERROR]", error);
    return new NextResponse("Lỗi khởi tạo thanh toán", { status: 500 });
  }
}
