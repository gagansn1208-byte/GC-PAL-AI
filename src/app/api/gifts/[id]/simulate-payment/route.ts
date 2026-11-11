import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";
import { markGiftPaid } from "@/lib/tracking";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const gift = db.gifts.find((g) => g.id === id);
  if (!gift) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }
  if (gift.status !== "awaiting_payment") {
    return NextResponse.json({ error: "Gift is already paid" }, { status: 400 });
  }
  const transaction = markGiftPaid(gift);
  db.transactions.push(transaction);
  persist();
  return NextResponse.json({ gift, transaction });
}
