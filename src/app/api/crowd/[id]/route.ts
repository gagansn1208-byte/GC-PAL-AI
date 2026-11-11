import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const group = db.crowdGroups.find((g) => g.id === id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  const booking = group.bookingId
    ? db.bookings.find((b) => b.id === group.bookingId) ?? null
    : null;
  return NextResponse.json({ group, booking });
}
