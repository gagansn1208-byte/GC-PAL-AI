import { NextResponse } from "next/server";
import { confirmGroup } from "@/lib/crowd";
import { getDb, persist } from "@/lib/db";

interface ApproveBody {
  memberId?: string;
  action?: "approve" | "decline";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: ApproveBody;
  try {
    body = (await req.json()) as ApproveBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const db = getDb();
  const group = db.crowdGroups.find((g) => g.id === id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.status === "confirmed") {
    return NextResponse.json({ error: "Group is already confirmed" }, { status: 400 });
  }
  if (group.status === "cancelled") {
    return NextResponse.json({ error: "Group is cancelled" }, { status: 400 });
  }

  const member = group.members.find((m) => m.id === body.memberId);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  member.paymentStatus = body.action === "decline" ? "declined" : "approved";
  const booking = confirmGroup(db, group);
  persist();
  return NextResponse.json({ group, booking: booking ?? null });
}
