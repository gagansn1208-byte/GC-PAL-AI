import { convert, getRates } from "./currency";
import { COUNTRIES, findCountry, MARKUP, MERCHANTS } from "./seed";
import type { Offer, Product } from "./types";
import { round2 } from "./utils";

function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function shipping(originRegion: string, destRegion: string, seed: number): { cost: number; days: number } {
  if (originRegion === destRegion) {
    return { cost: 4 + (seed % 5), days: 2 + (seed % 3) };
  }
  const far =
    originRegion === "SA" ||
    originRegion === "AFR" ||
    destRegion === "SA" ||
    destRegion === "AFR";
  if (far) {
    return { cost: 14 + (seed % 8), days: 8 + (seed % 5) };
  }
  return { cost: 9 + (seed % 6), days: 5 + (seed % 4) };
}

export function buildOffersFor(product: Product, destCode: string, rates: Record<string, number>): Offer[] {
  const dest = findCountry(destCode);
  return COUNTRIES.map((origin) => {
    const seed = hash(`${product.id}:${origin.code}:${dest.code}`);
    const discountPct = 5 + (seed % 26);
    const markup = MARKUP[origin.code] ?? 1;
    const priceUSD = round2(product.baseUSD * markup * (1 - discountPct / 100));
    const merchants = MERCHANTS[origin.code] ?? ["GlobalMart"];
    const merchant = merchants[seed % merchants.length];
    const sameCountry = origin.code === dest.code;
    const { cost, days } = sameCountry
      ? { cost: 0, days: 1 + (seed % 3) }
      : shipping(origin.region, dest.region, seed);
    const totalUSD = round2(priceUSD + cost);
    const priceLocal = round2(convert(priceUSD, origin.currency, rates));
    const totalDest = round2(convert(totalUSD, dest.currency, rates));
    return {
      origin: origin.code,
      originName: origin.name,
      flag: origin.flag,
      currency: origin.currency,
      merchant,
      priceUSD,
      priceLocal,
      discountPct,
      shippingUSD: cost,
      shippingDays: days,
      totalUSD,
      totalDest,
      destCurrency: dest.currency,
      inStock: seed % 10 !== 0,
    };
  });
}

export async function offersForProduct(product: Product, destCode: string): Promise<Offer[]> {
  const rates = await getRates("USD");
  return buildOffersFor(product, destCode, rates);
}

export function pickBest(offers: Offer[]): { best: Offer; worst: Offer; rows: Offer[] } {
  const live = offers.filter((o) => o.inStock);
  const pool = live.length ? live : offers;
  const rows = [...pool].sort((a, b) => a.totalUSD - b.totalUSD);
  return { best: rows[0], worst: rows[rows.length - 1], rows };
}
