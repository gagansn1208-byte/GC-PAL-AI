import { NextResponse } from "next/server";
import { confirmGroup } from "@/lib/crowd";
import { getDb, persist } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const group = db.crowdGroups.find((g) => g.id === id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.status === "cancelled") {
    return NextResponse.json({ error: "Group is cancelled" }, { status: 400 });
  }
  if (group.members.length < 2) {
    return NextResponse.json(
      { error: "A crowd needs at least 2 travellers before confirming" },
      { status: 400 }
    );
  }

  for (const m of group.members) {
    if (m.paymentStatus !== "approved") m.paymentStatus = "approved";
  }
  const booking = confirmGroup(db, group);
  if (!booking) {
    return NextResponse.json({ error: "Could not confirm group booking" }, { status: 400 });
  }
  persist();
  return NextResponse.json({ group, booking });
}
