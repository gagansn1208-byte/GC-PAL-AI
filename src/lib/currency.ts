const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.1,
  JPY: 151.4,
  AUD: 1.52,
  CAD: 1.36,
  SGD: 1.34,
  AED: 3.67,
  BRL: 5.05,
  MXN: 17,
  ZAR: 18.6,
  NGN: 1450,
  CNY: 7.23,
};

const TTL_MS = 30 * 60 * 1000;

let cache: { at: number; base: string; rates: Record<string, number> } | null = null;

export async function getRates(base = "USD"): Promise<Record<string, number>> {
  if (cache && cache.base === base && Date.now() - cache.at < TTL_MS) {
    return cache.rates;
  }
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as {
        result?: string;
        rates?: Record<string, number>;
      };
      if (data.result === "success" && data.rates) {
        cache = { at: Date.now(), base, rates: data.rates };
        return data.rates;
      }
    }
  } catch {
    //
  }
  if (base === "USD") return FALLBACK_RATES;
  const baseRate = FALLBACK_RATES[base] ?? 1;
  const out: Record<string, number> = {};
  for (const [code, rate] of Object.entries(FALLBACK_RATES)) {
    out[code] = rate / baseRate;
  }
  return out;
}

export function convert(usd: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency];
  if (typeof rate === "number" && rate > 0) return usd * rate;
  return usd;
}
