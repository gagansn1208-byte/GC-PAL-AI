"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BOOKING_ICONS,
  BOOKING_LABELS,
  MODES,
  MODE_INFO,
  nextTier,
  seatsToNextTier,
} from "@/lib/tickets";
import type {
  BookingStep,
  CrowdGroup,
  GroupMember,
  TicketBooking,
  TicketMode,
  TicketOffer,
} from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/utils";

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function durationLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

const STATUS_STYLE: Record<string, string> = {
  matching: "bg-sky-100 text-sky-800",
  pending_approvals: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-700",
};

const PAY_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  declined: "bg-rose-100 text-rose-700",
};

export default function CrowdTicketPage() {
  const [mode, setMode] = useState<TicketMode>("flight");
  const [fromCity, setFromCity] = useState("Mumbai");
  const [toCity, setToCity] = useState("Dubai");
  const [departAt, setDepartAt] = useState("");
  const [seats, setSeats] = useState(1);
  const [name, setName] = useState("");

  const [offers, setOffers] = useState<TicketOffer[] | null>(null);
  const [discovering, setDiscovering] = useState(false);

  const [group, setGroup] = useState<CrowdGroup | null>(null);
  const [booking, setBooking] = useState<TicketBooking | null>(null);
  const [matching, setMatching] = useState(false);
  const [matched, setMatched] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [groups, setGroups] = useState<CrowdGroup[]>([]);
  const [bookings, setBookings] = useState<TicketBooking[]>([]);

  useEffect(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setHours(8, 0, 0, 0);
    setDepartAt(toLocalInput(d));
  }, []);

  const loadAll = useCallback(async () => {
    const [gRes, bRes] = await Promise.all([fetch("/api/crowd"), fetch("/api/bookings")]);
    const gJson = await gRes.json();
    const bJson = await bRes.json();
    if (gRes.ok) setGroups(gJson.groups as CrowdGroup[]);
    if (bRes.ok) setBookings(bJson.bookings as TicketBooking[]);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const modeInfo = MODE_INFO[mode];

  const discover = async () => {
    setDiscovering(true);
    setError(null);
    try {
      const params = new URLSearchParams({ mode, from: fromCity, to: toCity, date: departAt, seats: String(seats) });
      const res = await fetch(`/api/tickets/discover?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Discovery failed");
      setOffers(json.offers as TicketOffer[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  };

  const joinCrowd = async (carrier?: string) => {
    if (!name.trim()) {
      setError("Enter your name so the crowd knows who is joining.");
      return;
    }
    setMatching(true);
    setError(null);
    try {
      const res = await fetch("/api/crowd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mode,
          from: fromCity,
          to: toCity,
          departAt: new Date(departAt).toISOString(),
          seats,
          carrier,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not match a crowd");
      setGroup(json.group as CrowdGroup);
      setBooking(null);
      setMatched(Boolean(json.matched));
      loadAll();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not match a crowd");
    } finally {
      setMatching(false);
    }
  };

  const approve = async (memberId: string, action: "approve" | "decline") => {
    if (!group) return;
    const res = await fetch(`/api/crowd/${group.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action }),
    });
    const json = await res.json();
    if (res.ok) {
      setGroup(json.group as CrowdGroup);
      if (json.booking) setBooking(json.booking as TicketBooking);
      loadAll();
    } else {
      setError(json.error || "Could not update approval");
    }
  };

  const confirm = async () => {
    if (!group) return;
    const res = await fetch(`/api/crowd/${group.id}/confirm`, { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setGroup(json.group as CrowdGroup);
      setBooking(json.booking as TicketBooking);
      loadAll();
    } else {
      setError(json.error || "Could not confirm booking");
    }
  };

  const openGroup = async (id: string) => {
    const res = await fetch(`/api/crowd/${id}`);
    const json = await res.json();
    if (res.ok) {
      setGroup(json.group as CrowdGroup);
      setBooking((json.booking as TicketBooking) ?? null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const advance = async (bookingId: string) => {
    const res = await fetch(`/api/bookings/${bookingId}/tracking`, { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      const updated = json.booking as TicketBooking;
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (booking?.id === updated.id) setBooking(updated);
    }
  };

  const seatsBooked = group ? group.members.reduce((s, m) => s + m.seats, 0) : 0;
  const needNext = seatsToNextTier(seatsBooked);
  const upcoming = nextTier(seatsBooked);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="anime-chip mb-2 bg-anime-purple text-white">✨ GC PAL AI</span>
          <h1 className="text-3xl font-black text-anime-ink sm:text-4xl">
            🎟️ CrowdTicket <span className="anime-title">AI</span>
          </h1>
          <p className="mt-1 max-w-2xl text-anime-ink/70">
            Global group ticket booking &amp; discounts. Discover flights, buses, trains and events,
            get matched with people on the same journey within two hours, unlock AI group offers,
            approve your own payment and track the booking together.
          </p>
        </div>
        <span className="anime-chip bg-anime-yellow text-anime-ink">
          <span className="anime-sparkle">✨</span> Group savings up to 25%
        </span>
      </div>

      {error && (
        <div className="anime-card mt-6 border-rose-400 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      {group && matched !== null && (
        <div
          className={`anime-pop anime-card mt-6 p-4 text-sm font-bold ${
            matched ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-sky-400 bg-sky-50 text-sky-800"
          }`}
        >
          {matched
            ? "🔗 Matched! You joined an existing crowd departing within the two-hour window."
            : "🌱 No crowd found within two hours — you started a new one. Share the journey to fill the seats and unlock bigger discounts."}
        </div>
      )}

      {/* Journey form */}
      <section className="anime-card mt-6 p-6">
        <h2 className="text-lg font-black text-anime-ink">1 · Find your journey</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {MODES.map((m) => {
            const info = MODE_INFO[m];
            const active = m === mode;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setOffers(null);
                }}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-black transition ${
                  active
                    ? "border-anime-ink bg-anime-pink text-white shadow-[3px_3px_0_rgba(30,27,58,0.9)]"
                    : "border-anime-ink/40 bg-white text-anime-ink/70 hover:border-anime-ink"
                }`}
              >
                {info.emoji} {info.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-bold text-anime-ink">
              {mode === "event" ? "City" : "From"}
            </label>
            <input value={fromCity} onChange={(e) => setFromCity(e.target.value)} className="anime-input" placeholder="e.g. Mumbai" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-anime-ink">
              {mode === "event" ? "Event / venue" : "To"}
            </label>
            <input value={toCity} onChange={(e) => setToCity(e.target.value)} className="anime-input" placeholder={mode === "event" ? "e.g. Aurora Live Festival" : "e.g. Dubai"} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-anime-ink">Departure</label>
            <input type="datetime-local" value={departAt} onChange={(e) => setDepartAt(e.target.value)} className="anime-input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-anime-ink">Your name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="anime-input" placeholder="e.g. Aiko Tanaka" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-anime-ink">Seats</label>
            <input
              type="number"
              min={1}
              max={6}
              value={seats}
              onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))}
              className="anime-input"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={discover}
              disabled={discovering || !fromCity || !toCity || !departAt}
              className="anime-btn flex-1 px-4 py-2.5 text-sm"
            >
              {discovering ? "Scanning…" : "🔍 Discover tickets"}
            </button>
          </div>
        </div>
      </section>

      {/* Discovered offers */}
      {offers && offers.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-black text-anime-ink">
            2 · {modeInfo.emoji} {modeInfo.label} offers for {seats} seat{seats === 1 ? "" : "s"}
          </h2>
          <p className="text-sm text-anime-ink/60">
            Prices already include the group discount for your party size. Pick a carrier to start or
            join a crowd.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <div key={o.id} className="anime-card anime-card-hover flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="anime-chip">
                    {o.carrierEmoji} {o.carrier}
                  </span>
                  {o.live ? (
                    <span className="text-xs font-black text-emerald-600">● live</span>
                  ) : (
                    <span className="text-xs font-black text-rose-500">sold out</span>
                  )}
                </div>
                <p className="mt-3 text-sm font-bold text-anime-ink">
                  {o.fromCity} → {o.toCity}
                </p>
                <p className="text-xs text-anime-ink/60">
                  {formatTime(o.departAt)} → {formatTime(o.arriveAt)} · {durationLabel(o.durationMin)}
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-2xl font-black text-anime-ink">
                    {formatMoney(o.groupPerPersonUSD, "USD")}
                  </span>
                  <span className="text-xs font-bold text-anime-ink/50">/ person</span>
                </div>
                <p className="text-xs font-bold text-anime-ink/60">
                  Solo {formatMoney(o.soloUSD, "USD")} ·{" "}
                  <span className="text-emerald-700">{o.groupDiscountPct}% group off</span>
                </p>
                <p className="mt-1 text-xs font-bold text-anime-pink">
                  Group total {formatMoney(o.groupTotalUSD, "USD")} · save {formatMoney(o.savingsUSD, "USD")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {o.perks.map((p) => (
                    <span key={p} className="rounded-full bg-anime-purple/10 px-2 py-0.5 text-[11px] font-bold text-anime-purple">
                      {p}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => joinCrowd(o.carrier)}
                  disabled={matching || !o.live}
                  className="anime-btn mt-4 w-full px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {matching ? "Matching…" : "👥 Start / join crowd"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active group */}
      {group && (
        <section className="anime-panel mt-8 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className={`anime-chip ${STATUS_STYLE[group.status]}`}>
                {group.status === "confirmed" ? "✅ confirmed" : group.status === "pending_approvals" ? "⏳ approvals" : "🔎 matching"}
              </span>
              <h2 className="mt-2 text-xl font-black text-anime-ink">
                {MODE_INFO[group.mode].emoji} {group.fromCity} → {group.toCity}
              </h2>
              <p className="text-sm font-bold text-anime-ink/70">
                {group.offer.carrier} · {formatDateTime(group.departAt)} · {durationLabel(group.offer.durationMin)}
              </p>
              <p className="mt-1 text-xs font-bold text-anime-purple">
                🕒 2-hour matching window: {formatTime(group.windowStart)} – {formatTime(group.windowEnd)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-anime-ink">
                {formatMoney(group.offer.groupPerPersonUSD, "USD")}
              </p>
              <p className="text-xs font-bold text-anime-ink/60">per person · {group.offer.groupDiscountPct}% off</p>
              <p className="text-xs font-bold text-emerald-700">Group saves {formatMoney(group.offer.savingsUSD, "USD")}</p>
            </div>
          </div>

          {/* AI group offer */}
          <div className="anime-card mt-5 border-anime-purple bg-gradient-to-br from-anime-pink/10 to-anime-blue/10 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="anime-chip bg-anime-purple text-white">
                🤖 {group.engine === "llm" ? "AI group offer" : "Smart group engine"}
              </span>
              <span className="text-xs font-bold text-anime-ink/60">
                {group.engine === "llm" ? "LLM-powered discovery" : "Set AI_API_KEY for LLM-powered discovery"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-anime-ink">{group.aiSummary}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {group.aiTips.map((tip, i) => (
                <li key={i} className="rounded-xl border-2 border-anime-ink/20 bg-white/80 px-3 py-2 text-xs font-medium text-anime-ink/80">
                  💡 {tip}
                </li>
              ))}
            </ul>
            {upcoming && needNext !== null && (
              <p className="mt-3 text-xs font-black text-anime-pink">
                🎯 Add {needNext} more seat{needNext === 1 ? "" : "s"} to reach the {upcoming.pct}% group tier.
              </p>
            )}
          </div>

          {/* Members + individual approvals */}
          <h3 className="mt-6 text-base font-black text-anime-ink">
            👥 Crowd members ({group.members.length}) · {seatsBooked}/{group.capacity} seats
          </h3>
          <div className="mt-3 space-y-2">
            {group.members.map((m: GroupMember) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-anime-ink/20 bg-white/80 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-anime-ink bg-anime-blue/30 text-sm font-black text-anime-ink">
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-anime-ink">{m.name}</p>
                  <p className="text-xs text-anime-ink/60">
                    {m.seats} seat{m.seats === 1 ? "" : "s"} · {formatMoney(group.offer.groupPerPersonUSD * m.seats, "USD")}
                  </p>
                </div>
                <span className={`anime-chip ${PAY_STYLE[m.paymentStatus]}`}>{m.paymentStatus}</span>
                {group.status !== "confirmed" && m.paymentStatus === "pending" && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => approve(m.id, "approve")} className="anime-btn-ghost px-3 py-1.5 text-xs">
                      ✅ Approve
                    </button>
                    <button type="button" onClick={() => approve(m.id, "decline")} className="anime-btn-ghost px-3 py-1.5 text-xs text-rose-600">
                      ✖ Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {group.status !== "confirmed" ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={confirm}
                disabled={group.members.length < 2}
                className="anime-btn px-5 py-2.5 text-sm"
              >
                🎫 Confirm group booking
              </button>
              <p className="text-xs font-bold text-anime-ink/60">
                {group.members.length < 2
                  ? "Share the journey — at least 2 travellers are needed."
                  : "Individual payment approvals: each traveller approves their own share. Confirming locks the group fare."}
              </p>
            </div>
          ) : (
            <p className="mt-5 text-sm font-black text-emerald-700">
              🎉 Group booking confirmed — see tracking below.
            </p>
          )}

          {/* Booking + tracking */}
          {booking && <BookingCard booking={booking} onAdvance={advance} />}
        </section>
      )}

      {/* My groups */}
      <section className="mt-10">
        <h2 className="text-lg font-black text-anime-ink">🗂️ My crowd groups</h2>
        {groups.length === 0 ? (
          <div className="anime-card mt-3 p-8 text-center">
            <p className="text-4xl">👥</p>
            <p className="mt-2 font-black text-anime-ink">No crowds yet</p>
            <p className="mt-1 text-sm text-anime-ink/60">Discover a journey above to start matching.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => openGroup(g.id)}
                className="anime-card anime-card-hover flex flex-wrap items-center gap-3 p-4 text-left"
              >
                <span className="text-2xl">{MODE_INFO[g.mode].emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-anime-ink">
                    {g.fromCity} → {g.toCity}
                  </p>
                  <p className="text-xs text-anime-ink/60">
                    {g.offer.carrier} · {formatDateTime(g.departAt)} · {g.members.length} member{g.members.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className={`anime-chip ${STATUS_STYLE[g.status]}`}>{g.status.replace("_", " ")}</span>
                <span className="text-sm font-black text-anime-pink">
                  {formatMoney(g.offer.groupPerPersonUSD, "USD")}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* My bookings */}
      <section className="mt-10">
        <h2 className="text-lg font-black text-anime-ink">🎫 My bookings</h2>
        {bookings.length === 0 ? (
          <div className="anime-card mt-3 p-8 text-center">
            <p className="text-4xl">🎟️</p>
            <p className="mt-2 font-black text-anime-ink">No bookings yet</p>
            <p className="mt-1 text-sm text-anime-ink/60">Confirm a crowd group to issue group tickets.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} onAdvance={advance} />
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 text-center text-xs font-bold text-anime-ink/50">
        Prices, carriers and schedules are deterministic demo data.{" "}
        <Link href="/" className="text-anime-purple underline">
          Back to GC PAL AI
        </Link>
      </p>
    </div>
  );
}

function BookingCard({
  booking,
  onAdvance,
}: {
  booking: TicketBooking;
  onAdvance: (id: string) => void;
}) {
  const atEnd = booking.trackingSteps[booking.trackingSteps.length - 1]?.status === "arrived";
  return (
    <div className="anime-card mt-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="anime-chip bg-emerald-100 text-emerald-800">🎫 {booking.reference}</span>
          <p className="mt-2 text-base font-black text-anime-ink">
            {booking.carrierEmoji} {booking.carrier} · {booking.fromCity} → {booking.toCity}
          </p>
          <p className="text-xs font-bold text-anime-ink/60">
            {formatDateTime(booking.departAt)} · {booking.seats} seat{booking.seats === 1 ? "" : "s"} ·{" "}
            {formatMoney(booking.perPersonUSD, "USD")}/person · total {formatMoney(booking.totalUSD, "USD")}
          </p>
        </div>
        <div className="text-right">
          <span className={`anime-chip ${STATUS_STYLE[booking.status] ?? "bg-anime-purple text-white"}`}>
            {BOOKING_ICONS[booking.status]} {BOOKING_LABELS[booking.status]}
          </span>
          <p className="mt-1 text-xs font-black text-emerald-700">Saved {formatMoney(booking.savingsUSD, "USD")}</p>
        </div>
      </div>

      <ol className="mt-4 space-y-2">
        {booking.trackingSteps.map((step: BookingStep, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-anime-ink bg-anime-yellow/60 text-xs">
              {BOOKING_ICONS[step.status]}
            </span>
            <div>
              <p className="text-sm font-black text-anime-ink">{BOOKING_LABELS[step.status]}</p>
              <p className="text-xs text-anime-ink/60">
                {formatDateTime(step.at)}
                {step.note ? ` · ${step.note}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => onAdvance(booking.id)}
        disabled={atEnd}
        className="anime-btn-ghost mt-4 px-4 py-2 text-xs disabled:opacity-50"
      >
        {atEnd ? "✅ Journey complete" : "⏩ Advance tracking (demo)"}
      </button>
    </div>
  );
}
