import { NextResponse } from "next/server";
import { MODES, MODE_INFO, defaultDepartTime, discoverTickets } from "@/lib/tickets";
import type { TicketMode } from "@/lib/types";

function normalizeDepartAt(mode: TicketMode, raw: string): string | null {
  if (!raw) return null;
  const value = raw.includes("T") ? raw : defaultDepartTime(mode, raw);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "flight") as TicketMode;
  if (!MODES.includes(mode)) {
    return NextResponse.json({ error: "mode must be flight, bus, train or event" }, { status: 400 });
  }
  const fromCity = (url.searchParams.get("from") ?? "").trim();
  const toCity = (url.searchParams.get("to") ?? "").trim();
  const date = url.searchParams.get("date") ?? "";
  const seats = Math.max(1, Math.min(12, Number(url.searchParams.get("seats") ?? 1) || 1));

  if (!fromCity || !toCity) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }
  const departAt = normalizeDepartAt(mode, date);
  if (!departAt) {
    return NextResponse.json({ error: "date must be a valid date or datetime" }, { status: 400 });
  }

  const offers = discoverTickets(mode, fromCity, toCity, departAt, seats);
  return NextResponse.json({
    mode,
    modeLabel: MODE_INFO[mode].label,
    fromCity,
    toCity,
    departAt,
    seats,
    offers,
  });
}
