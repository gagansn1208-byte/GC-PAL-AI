import { NextResponse } from "next/server";
import { offersForProduct } from "@/lib/offers";
import { findCountry, PRODUCTS, searchProducts } from "@/lib/seed";
import type { SearchItem } from "@/lib/types";
import { round2 } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const country = (searchParams.get("country") ?? "US").toUpperCase();
  const destination = findCountry(country);
  const products = q ? searchProducts(q) : PRODUCTS.slice(0, 8);
  const items: SearchItem[] = await Promise.all(
    products.slice(0, 12).map(async (product) => {
      const offers = await offersForProduct(product, destination.code);
      const live = offers.filter((o) => o.inStock);
      const pool = live.length ? live : offers;
      const sorted = [...pool].sort((a, b) => a.totalUSD - b.totalUSD);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      return {
        product,
        offer: best,
        offersCount: live.length,
        worstTotalUSD: worst.totalUSD,
        savingsUSD: round2(worst.totalUSD - best.totalUSD),
      };
    })
  );
  items.sort((a, b) => a.offer.totalUSD - b.offer.totalUSD);
  return NextResponse.json({ query: q, destination, items });
}
