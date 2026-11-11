import type { BookingStatus, TicketMode, TicketOffer } from "./types";
import { round2 } from "./utils";

export const WINDOW_MS = 2 * 60 * 60 * 1000;

export interface ModeInfo {
  id: TicketMode;
  label: string;
  emoji: string;
  verb: string;
  baseUSD: number;
  baseMinutes: number;
  gradient: string;
  perks: string[];
}

export const MODE_INFO: Record<TicketMode, ModeInfo> = {
  flight: {
    id: "flight",
    label: "Flight",
    emoji: "✈️",
    verb: "Flying",
    baseUSD: 220,
    baseMinutes: 240,
    gradient: "from-sky-400 to-indigo-500",
    perks: ["23kg checked bag", "In-flight meal", "Priority boarding"],
  },
  bus: {
    id: "bus",
    label: "Bus",
    emoji: "🚌",
    verb: "Riding",
    baseUSD: 45,
    baseMinutes: 420,
    gradient: "from-emerald-400 to-teal-500",
    perks: ["Reclining seat", "Onboard Wi-Fi", "2 rest stops"],
  },
  train: {
    id: "train",
    label: "Train",
    emoji: "🚄",
    verb: "Riding",
    baseUSD: 90,
    baseMinutes: 300,
    gradient: "from-amber-400 to-orange-500",
    perks: ["Reserved window seat", "Power socket", "Café car"],
  },
  event: {
    id: "event",
    label: "Event",
    emoji: "🎟️",
    verb: "Attending",
    baseUSD: 120,
    baseMinutes: 180,
    gradient: "from-pink-400 to-fuchsia-500",
    perks: ["Group seating block", "Fast-lane entry", "Merch discount"],
  },
};

export const MODES: TicketMode[] = ["flight", "bus", "train", "event"];

const CARRIERS: Record<TicketMode, { name: string; emoji: string }[]> = {
  flight: [
    { name: "SkyJet", emoji: "✈️" },
    { name: "AeroLux", emoji: "🛫" },
    { name: "NimbusAir", emoji: "🌤️" },
  ],
  bus: [
    { name: "RoadRunner Coaches", emoji: "🚌" },
    { name: "GreenLine Express", emoji: "🛣️" },
  ],
  train: [
    { name: "BulletRail", emoji: "🚄" },
    { name: "NightRail Sleeper", emoji: "🚆" },
  ],
  event: [
    { name: "Aurora Live", emoji: "🎤" },
    { name: "Stadium Hub", emoji: "🏟️" },
  ],
};

const GROUP_TIERS = [
  { min: 12, pct: 25 },
  { min: 8, pct: 18 },
  { min: 5, pct: 12 },
  { min: 3, pct: 8 },
  { min: 2, pct: 5 },
];

export function groupDiscountPct(size: number): number {
  return GROUP_TIERS.find((t) => size >= t.min)?.pct ?? 0;
}

export function nextTier(size: number): { seats: number; pct: number } | null {
  const upcoming = [...GROUP_TIERS].reverse().find((t) => t.min > size);
  return upcoming ? { seats: upcoming.min, pct: upcoming.pct } : null;
}

export function seatsToNextTier(size: number): number | null {
  const tier = nextTier(size);
  return tier ? tier.seats - size : null;
}

function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function defaultDepartTime(mode: TicketMode, dateStr: string): string {
  const hour = mode === "event" ? 19 : mode === "bus" ? 7 : mode === "train" ? 9 : 8;
  return `${dateStr}T${String(hour).padStart(2, "0")}:00`;
}

function makeOffer(
  mode: TicketMode,
  fromCity: string,
  toCity: string,
  departAt: string,
  groupSize: number,
  carrier: { name: string; emoji: string },
  carrierIndex: number
): TicketOffer {
  const seed = hash(`${mode}:${fromCity}:${toCity}:${carrier.name}`);
  const info = MODE_INFO[mode];
  const distance = 0.7 + (seed % 60) / 40;
  const soloUSD = round2(info.baseUSD * distance);
  const durationMin = Math.round(info.baseMinutes * (0.8 + (seed % 50) / 50));
  const depart = new Date(new Date(departAt).getTime() + carrierIndex * 35 * 60000);
  const arrive = new Date(depart.getTime() + durationMin * 60000);
  const size = Math.max(1, groupSize);
  const discountPct = groupDiscountPct(size);
  const groupPerPersonUSD = round2(soloUSD * (1 - discountPct / 100));
  const groupTotalUSD = round2(groupPerPersonUSD * size);
  const savingsUSD = round2((soloUSD - groupPerPersonUSD) * size);
  return {
    id: `${mode}-${seed.toString(36)}-${carrierIndex}`,
    mode,
    carrier: carrier.name,
    carrierEmoji: carrier.emoji,
    fromCity,
    toCity,
    departAt: depart.toISOString(),
    arriveAt: arrive.toISOString(),
    durationMin,
    soloUSD,
    groupSize: size,
    groupDiscountPct: discountPct,
    groupPerPersonUSD,
    groupTotalUSD,
    savingsUSD,
    seatsLeft: 12 + (seed % 44),
    perks: info.perks,
    live: seed % 11 !== 0,
  };
}

export function discoverTickets(
  mode: TicketMode,
  fromCity: string,
  toCity: string,
  departAt: string,
  seats = 1
): TicketOffer[] {
  const carriers = CARRIERS[mode];
  return carriers
    .map((carrier, i) => makeOffer(mode, fromCity, toCity, departAt, seats, carrier, i))
    .sort((a, b) => a.groupTotalUSD - b.groupTotalUSD);
}

export function offerForGroup(input: {
  mode: TicketMode;
  fromCity: string;
  toCity: string;
  departAt: string;
  groupSize: number;
  carrier?: string;
}): TicketOffer {
  const carriers = CARRIERS[input.mode];
  const idx = Math.max(
    0,
    carriers.findIndex((c) => c.name === input.carrier)
  );
  const carrier = carriers[idx] ?? carriers[0];
  return makeOffer(
    input.mode,
    input.fromCity,
    input.toCity,
    input.departAt,
    input.groupSize,
    carrier,
    idx
  );
}

export function withinWindow(aIso: string, bIso: string): boolean {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) <= WINDOW_MS;
}

export function matchWindow(departAt: string): { start: string; end: string } {
  const t = new Date(departAt).getTime();
  return {
    start: new Date(t - WINDOW_MS / 2).toISOString(),
    end: new Date(t + WINDOW_MS / 2).toISOString(),
  };
}

/* ---------- AI-powered group offer discovery ---------- */

export interface CrowdAiResult {
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

export async function aiCrowdOffer(input: {
  mode: TicketMode;
  fromCity: string;
  toCity: string;
  departAt: string;
  seats: number;
  members: number;
  offer: TicketOffer;
}): Promise<CrowdAiResult> {
  const key = process.env.AI_API_KEY;
  if (!key) return crowdRules(input);
  try {
    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const system =
      "You are CrowdTicket AI, a global group-ticket deal analyst. A group of travellers is booking together and unlocking group discounts. " +
      "Reply ONLY with a JSON object: {\"summary\": string, \"tips\": string[]}. " +
      "The summary must be under 70 words, mention the carrier, route, group size, per-person group price, total savings and the next discount tier. " +
      "Give 3 to 4 short practical tips as strings.";
    const user = JSON.stringify({
      mode: MODE_INFO[input.mode].label,
      route: `${input.fromCity} -> ${input.toCity}`,
      departAt: input.departAt,
      travellers: input.members,
      seats: input.seats,
      carrier: input.offer.carrier,
      soloUSD: input.offer.soloUSD,
      groupPerPersonUSD: input.offer.groupPerPersonUSD,
      groupDiscountPct: input.offer.groupDiscountPct,
      groupTotalUSD: input.offer.groupTotalUSD,
      savingsUSD: input.offer.savingsUSD,
      seatsToNextTier: seatsToNextTier(input.seats),
    });
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
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
      tips: parsed.tips.slice(0, 4).map(String),
    };
  } catch {
    return crowdRules(input);
  }
}

function crowdRules(input: {
  mode: TicketMode;
  fromCity: string;
  toCity: string;
  seats: number;
  members: number;
  offer: TicketOffer;
}): CrowdAiResult {
  const info = MODE_INFO[input.mode];
  const o = input.offer;
  const need = seatsToNextTier(input.seats);
  const next = nextTier(input.seats);
  const summary =
    `${o.carrier} group deal for ${info.verb.toLowerCase()} ${input.fromCity} → ${input.toCity}: ` +
    `${input.members} travellers, ${input.seats} seat${input.seats === 1 ? "" : "s"} booked together at ` +
    `$${o.groupPerPersonUSD.toFixed(2)} each (${o.groupDiscountPct}% group discount, was $${o.soloUSD.toFixed(2)} solo). ` +
    `Group total $${o.groupTotalUSD.toFixed(2)} — saving $${o.savingsUSD.toFixed(2)}. ` +
    (next
      ? `Add ${need} more seat${need === 1 ? "" : "s"} to reach the ${next.pct}% tier.`
      : `You have unlocked the maximum 25% group tier. 🎉`);
  const tips = [
    `Per-person group fare: $${o.groupPerPersonUSD.toFixed(2)} (solo fare $${o.soloUSD.toFixed(2)}).`,
    `Group discount tier: ${o.groupDiscountPct}%${next ? ` — next tier ${next.pct}% at ${next.seats} seats.` : " (max tier)."}`,
    `Departure window: matches anyone booking within 2 hours of ${new Date(o.departAt).toLocaleString("en-US")}.`,
  ];
  if (o.perks.length) tips.push(`Included: ${o.perks.join(", ")}.`);
  return { engine: "rules", summary, tips };
}

/* ---------- Booking tracking ---------- */

export const BOOKING_FLOW: Record<TicketMode, BookingStatus[]> = {
  flight: ["confirmed", "ticketed", "checked_in", "boarding", "in_transit", "arrived"],
  train: ["confirmed", "ticketed", "boarding", "in_transit", "arrived"],
  bus: ["confirmed", "ticketed", "boarding", "in_transit", "arrived"],
  event: ["confirmed", "ticketed", "checked_in", "arrived"],
};

export const BOOKING_LABELS: Record<BookingStatus, string> = {
  pending_payments: "Awaiting group approvals",
  confirmed: "Group booking confirmed",
  ticketed: "Tickets issued",
  checked_in: "Checked in",
  boarding: "Boarding",
  in_transit: "In transit",
  arrived: "Arrived",
  cancelled: "Cancelled",
};

export const BOOKING_ICONS: Record<BookingStatus, string> = {
  pending_payments: "⏳",
  confirmed: "✅",
  ticketed: "🎫",
  checked_in: "🛂",
  boarding: "🚪",
  in_transit: "🛰️",
  arrived: "🎉",
  cancelled: "❌",
};

export const BOOKING_NOTES: Partial<Record<BookingStatus, string>> = {
  confirmed: "Every traveller approved their share — the group booking is locked in.",
  ticketed: "Carrier issued e-tickets for the whole group with group seating.",
  checked_in: "Check-in complete. Documents verified for all travellers.",
  boarding: "Group called to the gate. Have tickets and ID ready.",
  in_transit: "On the way. Live journey updates are streaming to the group.",
  arrived: "Journey complete. Thanks for travelling with CrowdTicket AI!",
};

export function nextBookingStatus(mode: TicketMode, current: BookingStatus): BookingStatus | null {
  const flow = BOOKING_FLOW[mode];
  const idx = flow.indexOf(current);
  if (idx === -1) return null;
  return idx < flow.length - 1 ? flow[idx + 1] : null;
}

export function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CT-${out}`;
}
