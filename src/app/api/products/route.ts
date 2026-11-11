import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/seed";

export async function GET() {
  return NextResponse.json({ products: PRODUCTS });
}
