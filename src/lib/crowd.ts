import type { DB } from "./db";
import {
  BOOKING_NOTES,
  aiCrowdOffer,
  discoverTickets,
  matchWindow,
  makeReference,
  offerForGroup,
  withinWindow,
} from "./tickets";
import type { CrowdGroup, GroupMember, TicketBooking, TicketMode } from "./types";

export const DEFAULT_CAPACITY = 8;

export function totalSeats(group: CrowdGroup): number {
  return group.members.reduce((sum, m) => sum + m.seats, 0);
}

export function makeMember(name: string, seats: number): GroupMember {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    seats: Math.max(1, Math.min(6, seats || 1)),
    paymentStatus: "pending",
    joinedAt: new Date().toISOString(),
  };
}

export async function refreshGroupOffer(group: CrowdGroup): Promise<CrowdGroup> {
  const seats = Math.max(1, totalSeats(group));
  group.offer = offerForGroup({
    mode: group.mode,
    fromCity: group.fromCity,
    toCity: group.toCity,
    departAt: group.departAt,
    groupSize: seats,
    carrier: group.offer?.carrier,
  });
  const ai = await aiCrowdOffer({
    mode: group.mode,
    fromCity: group.fromCity,
    toCity: group.toCity,
    departAt: group.departAt,
    seats,
    members: group.members.length,
    offer: group.offer,
  });
  group.engine = ai.engine;
  group.aiSummary = ai.summary;
  group.aiTips = ai.tips;
  return group;
}

export function findMatch(
  db: DB,
  mode: TicketMode,
  fromCity: string,
  toCity: string,
  departAt: string
): CrowdGroup | undefined {
  return db.crowdGroups.find(
    (g) =>
      g.mode === mode &&
      g.status !== "confirmed" &&
      g.status !== "cancelled" &&
      g.fromCity.toLowerCase() === fromCity.toLowerCase() &&
      g.toCity.toLowerCase() === toCity.toLowerCase() &&
      withinWindow(g.departAt, departAt) &&
      totalSeats(g) < g.capacity
  );
}

export async function createGroup(input: {
  mode: TicketMode;
  fromCity: string;
  toCity: string;
  departAt: string;
  member: GroupMember;
  carrier?: string;
}): Promise<CrowdGroup> {
  const seats = Math.max(1, input.member.seats);
  const offers = discoverTickets(input.mode, input.fromCity, input.toCity, input.departAt, seats);
  const chosen =
    (input.carrier && offers.find((o) => o.carrier === input.carrier)) || offers[0];
  const window = matchWindow(input.departAt);
  const group: CrowdGroup = {
    id: crypto.randomUUID(),
    mode: input.mode,
    fromCity: input.fromCity,
    toCity: input.toCity,
    departAt: new Date(input.departAt).toISOString(),
    windowStart: window.start,
    windowEnd: window.end,
    capacity: DEFAULT_CAPACITY,
    status: "matching",
    members: [input.member],
    offer: chosen,
    engine: "rules",
    aiSummary: "",
    aiTips: [],
    createdAt: new Date().toISOString(),
  };
  await refreshGroupOffer(group);
  return group;
}

export async function joinGroup(group: CrowdGroup, member: GroupMember): Promise<CrowdGroup> {
  group.members.push(member);
  if (group.members.length >= 2) group.status = "pending_approvals";
  await refreshGroupOffer(group);
  return group;
}

export function confirmGroup(db: DB, group: CrowdGroup): TicketBooking | undefined {
  if (group.bookingId) {
    return db.bookings.find((b) => b.id === group.bookingId);
  }
  if (group.members.length < 2) return undefined;
  if (!group.members.every((m) => m.paymentStatus === "approved")) return undefined;
  const now = new Date().toISOString();
  const booking: TicketBooking = {
    id: crypto.randomUUID(),
    groupId: group.id,
    reference: makeReference(),
    mode: group.mode,
    carrier: group.offer.carrier,
    carrierEmoji: group.offer.carrierEmoji,
    fromCity: group.fromCity,
    toCity: group.toCity,
    departAt: group.departAt,
    arriveAt: group.offer.arriveAt,
    seats: totalSeats(group),
    perPersonUSD: group.offer.groupPerPersonUSD,
    totalUSD: group.offer.groupTotalUSD,
    savingsUSD: group.offer.savingsUSD,
    status: "confirmed",
    trackingSteps: [{ status: "confirmed", at: now, note: BOOKING_NOTES.confirmed ?? "" }],
    createdAt: now,
  };
  group.status = "confirmed";
  group.bookingId = booking.id;
  db.bookings.push(booking);
  return booking;
}
