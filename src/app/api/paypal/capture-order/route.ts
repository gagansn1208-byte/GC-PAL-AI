import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";
import { captureOrder } from "@/lib/paypal";
import { markGiftPaid } from "@/lib/tracking";

export async function POST(req: Request) {
  let body: { orderId?: string; giftId?: string };
  try {
    body = (await req.json()) as { orderId?: string; giftId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const orderId = (body.orderId ?? "").trim();
  const giftId = (body.giftId ?? "").trim();
  const db = getDb();
  const gift =
    db.gifts.find((g) => g.id === giftId) ??
    db.gifts.find((g) => g.paypalOrderId === orderId);
  if (!orderId || !gift) {
    return NextResponse.json({ error: "Gift or order not found" }, { status: 404 });
  }
  try {
    const status = await captureOrder(orderId);
    if (status === "COMPLETED") {
      if (gift.status === "awaiting_payment") {
        const transaction = markGiftPaid(gift);
        db.transactions.push(transaction);
        persist();
      }
      return NextResponse.json({ ok: true, status, gift });
    }
    return NextResponse.json({ ok: false, status, gift }, { status: 402 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PayPal capture failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
