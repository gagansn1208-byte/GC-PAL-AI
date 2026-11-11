import { NextResponse } from "next/server";
import { aiCompare } from "@/lib/ai";
import { getRates } from "@/lib/currency";
import { buildOffersFor, pickBest } from "@/lib/offers";
import { findCountry, searchProducts } from "@/lib/seed";
import { round2 } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const country = (searchParams.get("country") ?? "US").toUpperCase();
  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }
  const matches = searchProducts(q);
  if (matches.length === 0) {
    return NextResponse.json({ error: `No products found for '${q}'` }, { status: 404 });
  }
  const product = matches[0];
  const destination = findCountry(country);
  const rates = await getRates("USD");
  const offers = buildOffersFor(product, destination.code, rates);
  const { best, worst, rows } = pickBest(offers);
  const savingsUSD = round2(worst.totalUSD - best.totalUSD);
  const ai = await aiCompare({ product, destination, rows, best, worst, savingsUSD });
  return NextResponse.json({
    query: q,
    product,
    destination,
    rows,
    best,
    worst,
    savingsUSD,
    engine: ai.engine,
    summary: ai.summary,
    tips: ai.tips,
  });
}
