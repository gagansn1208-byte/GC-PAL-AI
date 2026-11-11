import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";
import { BOOKING_NOTES, nextBookingStatus } from "@/lib/tickets";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Booking is cancelled" }, { status: 400 });
  }
  const next = nextBookingStatus(booking.mode, booking.status);
  if (!next) {
    return NextResponse.json({ booking });
  }
  booking.status = next;
  booking.trackingSteps.push({
    status: next,
    at: new Date().toISOString(),
    note: BOOKING_NOTES[next] ?? "",
  });
  persist();
  return NextResponse.json({ booking });
}
