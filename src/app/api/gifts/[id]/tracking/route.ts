import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { advanceTracking } from "@/lib/tracking";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gift = getDb().gifts.find((g) => g.id === id);
  if (!gift) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }
  if (gift.status === "awaiting_payment") {
    return NextResponse.json({ error: "Gift is not paid yet" }, { status: 400 });
  }
  if (gift.status === "cancelled") {
    return NextResponse.json({ error: "Gift is cancelled" }, { status: 400 });
  }
  const updated = advanceTracking(gift);
  return NextResponse.json({ gift: updated });
}
