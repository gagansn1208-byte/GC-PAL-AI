import { NextResponse } from "next/server";
import { getDb, persist } from "@/lib/db";
import { findCountry } from "@/lib/seed";
import type { EventItem } from "@/lib/types";

interface CreateEventBody {
  title?: string;
  type?: string;
  date?: string;
  country?: string;
  notes?: string;
}

export async function GET() {
  const db = getDb();
  const events = [...db.events].sort((a, b) => a.date.localeCompare(b.date));
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  let body: CreateEventBody;
  try {
    body = (await req.json()) as CreateEventBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const title = (body.title ?? "").trim();
  const type = (body.type ?? "Other").trim();
  const date = (body.date ?? "").trim();
  const country = (body.country ?? "US").trim().toUpperCase();
  const notes = (body.notes ?? "").trim();
  if (!title || !date) {
    return NextResponse.json({ error: "title and date are required" }, { status: 400 });
  }
  if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    return NextResponse.json({ error: "date must be a valid YYYY-MM-DD" }, { status: 400 });
  }
  const destination = findCountry(country);
  const event: EventItem = {
    id: crypto.randomUUID(),
    title,
    type,
    date,
    country: destination.code,
    countryName: destination.name,
    notes,
    createdAt: new Date().toISOString(),
  };
  const db = getDb();
  db.events.push(event);
  persist();
  return NextResponse.json({ event }, { status: 201 });
}
