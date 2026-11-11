import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gift = getDb().gifts.find((g) => g.id === id);
  if (!gift) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }
  return NextResponse.json({ gift });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const gift = db.gifts.find((g) => g.id === id);
  if (!gift) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }
  if (gift.status !== "delivered") {
    gift.status = "cancelled";
    gift.trackingSteps.push({
      status: "cancelled",
      at: new Date().toISOString(),
      note: "Gift cancelled by sender.",
    });
    persist();
  }
  return NextResponse.json({ gift });
}
