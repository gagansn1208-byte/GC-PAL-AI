import { NextResponse } from "next/server";
import { getRates } from "@/lib/currency";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") ?? "USD").toUpperCase();
  const rates = await getRates(base);
  return NextResponse.json({ base, rates });
}
