import { connection } from "next/server";
import { NextResponse } from "next/server";
import { paypalClientId, paypalConfigured, paypalMode } from "@/lib/paypal";

export async function GET() {
  await connection();
  return NextResponse.json({
    configured: paypalConfigured(),
    clientId: paypalConfigured() ? paypalClientId() : null,
    currency: "USD",
    mode: paypalMode(),
  });
}
