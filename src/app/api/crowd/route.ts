import { NextResponse } from "next/server";
import { createGroup, findMatch, joinGroup, makeMember } from "@/lib/crowd";
import { getDb, persist } from "@/lib/db";
import { MODES, MODE_INFO } from "@/lib/tickets";
import type { TicketMode } from "@/lib/types";

interface MatchBody {
  name?: string;
  mode?: string;
  from?: string;
  to?: string;
  departAt?: string;
  seats?: number;
  carrier?: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const db = getDb();
  let groups = [...db.crowdGroups];
  if (mode) groups = groups.filter((g) => g.mode === mode);
  if (from) groups = groups.filter((g) => g.fromCity.toLowerCase() === from.toLowerCase());
  if (to) groups = groups.filter((g) => g.toCity.toLowerCase() === to.toLowerCase());
  groups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  let body: MatchBody;
  try {
    body = (await req.json()) as MatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const mode = (body.mode ?? "flight") as TicketMode;
  const fromCity = (body.from ?? "").trim();
  const toCity = (body.to ?? "").trim();
  const rawDate = (body.departAt ?? "").trim();
  const seats = Math.max(1, Math.min(6, Number(body.seats ?? 1) || 1));

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!MODES.includes(mode)) {
    return NextResponse.json({ error: "mode must be flight, bus, train or event" }, { status: 400 });
  }
  if (!fromCity || !toCity) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }
  const depart = new Date(rawDate);
  if (Number.isNaN(depart.getTime())) {
    return NextResponse.json({ error: "departAt must be a valid datetime" }, { status: 400 });
  }
  const departAt = depart.toISOString();

  const db = getDb();
  const member = makeMember(name, seats);

  const existing = findMatch(db, mode, fromCity, toCity, departAt);
  if (existing) {
    await joinGroup(existing, member);
    persist();
    return NextResponse.json({ group: existing, matched: true }, { status: 200 });
  }

  const group = await createGroup({
    mode,
    fromCity,
    toCity,
    departAt,
    member,
    carrier: body.carrier,
  });
  db.crowdGroups.push(group);
  persist();
  return NextResponse.json(
    {
      group,
      matched: false,
      modeLabel: MODE_INFO[mode].label,
    },
    { status: 201 }
  );
}
