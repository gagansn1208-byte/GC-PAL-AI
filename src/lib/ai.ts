import type { Country, Offer, Product } from "./types";
import { formatMoney } from "./utils";

export interface AiResult {
  engine: "llm" | "rules";
  summary: string;
  tips: string[];
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

export async function aiCompare(input: {
  product: Product;
  destination: Country;
  rows: Offer[];
  best: Offer;
  worst: Offer;
  savingsUSD: number;
}): Promise<AiResult> {
  const key = process.env.AI_API_KEY;
  if (!key) return ruleBased(input);
  try {
    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const offers = input.rows.slice(0, 15).map((r) => ({
      country: r.originName,
      merchant: r.merchant,
      priceUSD: r.priceUSD,
      discountPct: r.discountPct,
      shippingUSD: r.shippingUSD,
      shippingDays: r.shippingDays,
      totalUSD: r.totalUSD,
      inStock: r.inStock,
    }));
    const system =
      "You are GC PAL AI, a global shopping deal analyst. Compare offers for one product shipped to one destination country. " +
      "Reply ONLY with a JSON object: {\"summary\": string, \"tips\": string[]}. " +
      "The summary must be under 80 words, mention the best merchant and country, the all-in total, savings vs the priciest option, and any delivery speed or customs trade-offs. " +
      "Give 3 to 5 short practical tips as strings.";
    const user = JSON.stringify({
      product: {
        name: input.product.name,
        brand: input.product.brand,
        category: input.product.category,
      },
      destination: input.destination.name,
      best: {
        country: input.best.originName,
        merchant: input.best.merchant,
        totalUSD: input.best.totalUSD,
        shippingDays: input.best.shippingDays,
        discountPct: input.best.discountPct,
      },
      savingsUSD: input.savingsUSD,
      offers,
    });
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);
    const data = (await res.json()) as ChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI returned no content");
    const parsed = JSON.parse(stripFences(content)) as { summary?: unknown; tips?: unknown };
    if (typeof parsed.summary !== "string" || !Array.isArray(parsed.tips)) {
      throw new Error("AI returned unexpected shape");
    }
    return {
      engine: "llm",
      summary: parsed.summary,
      tips: parsed.tips.slice(0, 5).map(String),
    };
  } catch {
    return ruleBased(input);
  }
}

function ruleBased(input: {
  product: Product;
  destination: Country;
  rows: Offer[];
  best: Offer;
  worst: Offer;
  savingsUSD: number;
}): AiResult {
  const { product, destination, rows, best, worst, savingsUSD } = input;
  const live = rows.filter((r) => r.inStock);
  const fastest = [...(live.length ? live : rows)].sort((a, b) => a.shippingDays - b.shippingDays)[0];
  const biggestDiscount = [...(live.length ? live : rows)].sort(
    (a, b) => b.discountPct - a.discountPct
  )[0];
  const local = rows.find((r) => r.origin === destination.code);
  const summary =
    `Best deal for ${product.name} shipped to ${destination.name}: ${best.merchant} in ${best.originName} at ` +
    `${formatMoney(best.totalUSD, "USD")} all-in (${best.discountPct}% off, shipping ${formatMoney(best.shippingUSD, "USD")}), ` +
    `arriving in about ${best.shippingDays} days. That saves ${formatMoney(savingsUSD, "USD")} versus the priciest option ` +
    `(${worst.merchant}, ${worst.originName} at ${formatMoney(worst.totalUSD, "USD")}).`;
  const tips = [
    `Lowest all-in total: ${best.merchant} (${best.originName}) — ${formatMoney(best.totalUSD, "USD")} including shipping.`,
    `Need it fast? ${fastest.merchant} (${fastest.originName}) delivers in about ${fastest.shippingDays} days.`,
  ];
  if (local) {
    tips.push(
      `Buying inside ${destination.name} (${local.merchant}) avoids international customs delays.`
    );
  }
  if (biggestDiscount) {
    tips.push(
      `Biggest discount: ${biggestDiscount.discountPct}% off at ${biggestDiscount.merchant} (${biggestDiscount.originName}).`
    );
  }
  if (savingsUSD > 0) {
    tips.push(
      `Choosing the best origin over the priciest one saves ${formatMoney(savingsUSD, "USD")} on this gift.`
    );
  }
  return { engine: "rules", summary, tips };
}
