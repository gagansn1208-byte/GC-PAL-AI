import { connection, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  await connection();
  const db = getDb();
  const bookings = [...db.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ bookings });
}
