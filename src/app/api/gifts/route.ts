import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";
import { getRates } from "@/lib/currency";
import { buildOffersFor, pickBest } from "@/lib/offers";
import { findCountry, findProduct } from "@/lib/seed";
import type { Gift } from "@/lib/types";
import { round2 } from "@/lib/utils";

interface CreateGiftBody {
  productId?: string;
  recipientName?: string;
  recipientCountry?: string;
  address?: string;
  message?: string;
  eventId?: string;
  quantity?: number;
  origin?: string;
}

export async function GET() {
  const db = getDb();
  const gifts = [...db.gifts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ gifts });
}

export async function POST(req: Request) {
  let body: CreateGiftBody;
  try {
    body = (await req.json()) as CreateGiftBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const productId = (body.productId ?? "").trim();
  const recipientName = (body.recipientName ?? "").trim();
  const recipientCountry = (body.recipientCountry ?? "").trim().toUpperCase();
  const address = (body.address ?? "").trim();
  const message = (body.message ?? "").trim();
  const quantity = Math.min(Math.max(Math.round(Number(body.quantity) || 1), 1), 10);
  if (!productId || !recipientName || !recipientCountry || !address) {
    return NextResponse.json(
      { error: "productId, recipientName, recipientCountry and address are required" },
      { status: 400 }
    );
  }
  const product = findProduct(productId);
  if (!product) {
    return NextResponse.json({ error: `Unknown product '${productId}'` }, { status: 400 });
  }
  const destination = findCountry(recipientCountry);
  const rates = await getRates("USD");
  const offers = buildOffersFor(product, destination.code, rates);
  const live = offers.filter((o) => o.inStock);
  let chosen = live.find((o) => o.origin === (body.origin ?? "").toUpperCase());
  if (!chosen) {
    chosen = pickBest(offers).best;
  }
  const event = body.eventId ? getDb().events.find((e) => e.id === body.eventId) : undefined;
  const gift: Gift = {
    id: crypto.randomUUID(),
    productId: product.id,
    productName: product.name,
    productEmoji: product.emoji,
    merchant: chosen.merchant,
    originCountry: chosen.origin,
    originCountryName: chosen.originName,
    recipientName,
    recipientCountry: destination.code,
    recipientCountryName: destination.name,
    address,
    message,
    eventId: event?.id,
    eventTitle: event?.title,
    quantity,
    currency: destination.currency,
    amountLocal: round2(chosen.totalDest * quantity),
    amountUSD: round2(chosen.totalUSD * quantity),
    status: "awaiting_payment",
    trackingSteps: [
      {
        status: "awaiting_payment",
        at: new Date().toISOString(),
        note: "Gift created. Awaiting PayPal payment.",
      },
    ],
    etaDays: chosen.shippingDays,
    createdAt: new Date().toISOString(),
  };
  const db = getDb();
  db.gifts.push(gift);
  persist();
  return NextResponse.json({ gift }, { status: 201 });
}
