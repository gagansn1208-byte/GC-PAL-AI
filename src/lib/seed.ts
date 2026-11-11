import type { Country, Product } from "./types";

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸", region: "NA" },
  { code: "CA", name: "Canada", currency: "CAD", flag: "🇨🇦", region: "NA" },
  { code: "MX", name: "Mexico", currency: "MXN", flag: "🇲🇽", region: "NA" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧", region: "EU" },
  { code: "DE", name: "Germany", currency: "EUR", flag: "🇩🇪", region: "EU" },
  { code: "FR", name: "France", currency: "EUR", flag: "🇫🇷", region: "EU" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", flag: "🇦🇪", region: "ME" },
  { code: "IN", name: "India", currency: "INR", flag: "🇮🇳", region: "APAC" },
  { code: "JP", name: "Japan", currency: "JPY", flag: "🇯🇵", region: "APAC" },
  { code: "CN", name: "China", currency: "CNY", flag: "🇨🇳", region: "APAC" },
  { code: "SG", name: "Singapore", currency: "SGD", flag: "🇸🇬", region: "APAC" },
  { code: "AU", name: "Australia", currency: "AUD", flag: "🇦🇺", region: "APAC" },
  { code: "BR", name: "Brazil", currency: "BRL", flag: "🇧🇷", region: "SA" },
  { code: "ZA", name: "South Africa", currency: "ZAR", flag: "🇿🇦", region: "AFR" },
  { code: "NG", name: "Nigeria", currency: "NGN", flag: "🇳🇬", region: "AFR" },
];

export function findCountry(code: string): Country {
  const upper = (code || "US").toUpperCase();
  return COUNTRIES.find((c) => c.code === upper) ?? COUNTRIES[0];
}

export const MERCHANTS: Record<string, string[]> = {
  US: ["Amazon US", "Walmart", "Best Buy"],
  CA: ["Amazon CA", "Best Buy CA"],
  MX: ["Mercado Libre MX", "Liverpool"],
  GB: ["Amazon UK", "Argos"],
  DE: ["Amazon DE", "MediaMarkt"],
  FR: ["Amazon FR", "Fnac"],
  AE: ["Noon", "Amazon AE"],
  IN: ["Amazon India", "Flipkart", "Tata CLiQ"],
  JP: ["Amazon JP", "Rakuten"],
  CN: ["JD.com", "Tmall Global"],
  SG: ["Amazon SG", "Shopee SG"],
  AU: ["Amazon AU", "JB Hi-Fi"],
  BR: ["Mercado Livre", "Magalu"],
  ZA: ["Takealot"],
  NG: ["Jumia", "Konga"],
};

export const MARKUP: Record<string, number> = {
  US: 1,
  CA: 1.04,
  MX: 1.06,
  GB: 1.02,
  DE: 0.98,
  FR: 1,
  AE: 0.95,
  IN: 0.86,
  JP: 0.94,
  CN: 0.88,
  SG: 0.96,
  AU: 1.08,
  BR: 1.1,
  ZA: 1.12,
  NG: 1.14,
};

export const EVENT_TYPES = [
  "Birthday",
  "Wedding",
  "Anniversary",
  "Festival",
  "Graduation",
  "Baby Shower",
  "Housewarming",
  "Corporate",
  "Other",
];

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Wireless Noise-Cancelling Headphones", brand: "SoundCore Pro", category: "Electronics", emoji: "🎧", baseUSD: 249, rating: 4.7, reviews: 8412, tags: ["audio", "music", "travel", "headphones"] },
  { id: "p2", name: "Nova X5 Smartphone 128GB", brand: "Nova", category: "Electronics", emoji: "📱", baseUSD: 699, rating: 4.5, reviews: 15320, tags: ["phone", "mobile", "tech", "smartphone"] },
  { id: "p3", name: "FitPulse S2 Smartwatch", brand: "FitPulse", category: "Electronics", emoji: "⌚", baseUSD: 199, rating: 4.6, reviews: 9021, tags: ["fitness", "watch", "health", "wearable"] },
  { id: "p4", name: "CleanBot X Robot Vacuum", brand: "CleanBot", category: "Home", emoji: "🤖", baseUSD: 399, rating: 4.4, reviews: 5310, tags: ["cleaning", "smart home", "robot", "gadget"] },
  { id: "p5", name: "BrewMaster One Espresso Machine", brand: "BrewMaster", category: "Home", emoji: "☕", baseUSD: 289, rating: 4.8, reviews: 6203, tags: ["coffee", "kitchen", "espresso"] },
  { id: "p6", name: "GlowLab Radiance Skincare Set", brand: "GlowLab", category: "Beauty", emoji: "💄", baseUSD: 89, rating: 4.7, reviews: 11205, tags: ["skincare", "glow", "self-care", "beauty"] },
  { id: "p7", name: "Aurora Nocturne Eau de Parfum 50ml", brand: "Aurora", category: "Beauty", emoji: "🌸", baseUSD: 129, rating: 4.6, reviews: 7344, tags: ["perfume", "fragrance", "luxury"] },
  { id: "p8", name: "Space Station Builder Kit 1000pc", brand: "BrickWorks", category: "Toys", emoji: "🚀", baseUSD: 119, rating: 4.9, reviews: 40233, tags: ["lego", "building", "kids", "space"] },
  { id: "p9", name: "Cuddle Giant Plush Bear 90cm", brand: "CuddleCo", category: "Toys", emoji: "🧸", baseUSD: 59, rating: 4.8, reviews: 18220, tags: ["plush", "kids", "soft toy", "bear"] },
  { id: "p10", name: "TrailTrek 45L Hiking Backpack", brand: "TrailTrek", category: "Outdoor", emoji: "🎒", baseUSD: 139, rating: 4.6, reviews: 6512, tags: ["hiking", "travel", "camping", "outdoor"] },
  { id: "p11", name: "Voyager Go 4K Action Camera", brand: "Voyager", category: "Outdoor", emoji: "📷", baseUSD: 279, rating: 4.5, reviews: 4980, tags: ["camera", "adventure", "vlog", "outdoor"] },
  { id: "p12", name: "DriftPod Mini Wireless Earbuds", brand: "DriftPod", category: "Electronics", emoji: "🎵", baseUSD: 99, rating: 4.4, reviews: 20150, tags: ["earbuds", "audio", "budget", "music"] },
  { id: "p13", name: "CocoaRoyale Truffle Box 24pc", brand: "CocoaRoyale", category: "Food", emoji: "🍫", baseUSD: 45, rating: 4.8, reviews: 9315, tags: ["chocolate", "sweets", "gourmet"] },
  { id: "p14", name: "BeanOrigin Single-Origin Coffee 1kg", brand: "BeanOrigin", category: "Food", emoji: "🫘", baseUSD: 38, rating: 4.7, reviews: 5108, tags: ["coffee", "beans", "gourmet"] },
  { id: "p15", name: "Lumière Bloom Silk Scarf", brand: "Lumière", category: "Fashion", emoji: "🧣", baseUSD: 85, rating: 4.6, reviews: 3302, tags: ["silk", "fashion", "accessory"] },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = PRODUCTS.map((p) => {
    const name = p.name.toLowerCase();
    const brand = p.brand.toLowerCase();
    const category = p.category.toLowerCase();
    const tags = p.tags.join(" ").toLowerCase();
    let score = 0;
    if (name === q) score += 10;
    if (name.includes(q)) score += 5;
    if (brand.includes(q)) score += 3;
    if (category.includes(q)) score += 2;
    if (tags.includes(q)) score += 2;
    return { p, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.p.baseUSD - b.p.baseUSD);
  return scored.map((s) => s.p);
}
