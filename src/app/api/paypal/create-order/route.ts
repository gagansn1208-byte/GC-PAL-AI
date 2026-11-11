import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";
import { createOrder, paypalConfigured } from "@/lib/paypal";

export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json(
      {
        error:
          "PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local (sandbox credentials).",
      },
      { status: 503 }
    );
  }
  let body: { giftId?: string };
  try {
    body = (await req.json()) as { giftId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const giftId = (body.giftId ?? "").trim();
  const gift = getDb().gifts.find((g) => g.id === giftId);
  if (!gift) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }
  try {
    const orderId = await createOrder({
      referenceId: gift.id,
      amountUSD: gift.amountUSD,
      description: `Gift: ${gift.productName} → ${gift.recipientName} (${gift.recipientCountryName})`,
    });
    gift.paypalOrderId = orderId;
    persist();
    return NextResponse.json({ orderId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PayPal order creation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
