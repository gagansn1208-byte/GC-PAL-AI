"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import CountrySelect from "@/components/CountrySelect";
import { EVENT_TYPES } from "@/lib/seed";
import type { EventItem, Gift } from "@/lib/types";
import { daysUntil, formatDate } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function countdown(days: number): { text: string; className: string } {
  if (days === 0) return { text: "🎉 Today!", className: "bg-rose-100 text-rose-700" };
  if (days < 0)
    return {
      text: `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`,
      className: "bg-slate-100 text-slate-500",
    };
  if (days <= 7) return { text: `in ${days} days`, className: "bg-amber-100 text-amber-800" };
  return { text: `in ${days} days`, className: "bg-sky-100 text-sky-800" };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState(EVENT_TYPES[0]);
  const [date, setDate] = useState("");
  const [country, setCountry] = useState("IN");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [eventsRes, giftsRes] = await Promise.all([fetch("/api/events"), fetch("/api/gifts")]);
    const eventsJson = await eventsRes.json();
    const giftsJson = await giftsRes.json();
    if (eventsRes.ok) setEvents(eventsJson.events as EventItem[]);
    if (giftsRes.ok) setGifts(giftsJson.gifts as Gift[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, date, country, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create event");
      setTitle("");
      setDate("");
      setNotes("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event");
    } finally {
      setBusy(false);
    }
  };

  const giftCount = (eventId: string) => gifts.filter((g) => g.eventId === eventId).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">📅 Worldwide event management</h1>
      <p className="mt-1 text-slate-600">
        Never miss a birthday, wedding or festival — wherever in the world it happens.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">Event title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Meera’s Birthday"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Where is it happening?
          </label>
          <CountrySelect value={country} onChange={setCountry} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Notes (optional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Loves dark chocolate"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "➕ Add event"}
          </button>
          {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
        </div>
      </form>

      <h2 className="mt-12 text-2xl font-bold text-slate-900">Upcoming & recent events</h2>
      {events.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-4xl">🗓️</p>
          <p className="mt-2 font-semibold text-slate-900">No events yet</p>
          <p className="mt-1 text-sm text-slate-500">Add your first event above.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {events.map((event) => {
            const badge = countdown(daysUntil(event.date));
            const count = giftCount(event.id);
            return (
              <div
                key={event.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{event.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${badge.className}`}
                  >
                    {badge.text}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {event.type} · {formatDate(event.date)} · {event.countryName}
                </p>
                {event.notes && <p className="mt-1 text-xs text-slate-500">📝 {event.notes}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {count > 0 ? `🎁 ${count} gift${count === 1 ? "" : "s"} linked` : "No gifts yet"}
                  </span>
                  <Link
                    href={`/gifts?eventId=${event.id}&country=${event.country}`}
                    className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Send gift for this event
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
