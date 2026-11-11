"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import CountrySelect from "@/components/CountrySelect";
import PaymentPanel from "@/components/PaymentPanel";
import StatusChip from "@/components/StatusChip";
import type { EventItem, Gift, Product } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function GiftsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [productId, setProductId] = useState(searchParams.get("product") ?? "");
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState("");
  const [recipientCountry, setRecipientCountry] = useState(searchParams.get("country") ?? "IN");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [eventId, setEventId] = useState(searchParams.get("eventId") ?? "");
  const [createdGift, setCreatedGift] = useState<Gift | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGifts = useCallback(async () => {
    const res = await fetch("/api/gifts");
    const json = await res.json();
    if (res.ok) setGifts(json.gifts as Gift[]);
  }, []);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((json) => setProducts(json.products as Product[]))
      .catch(() => setProducts([]));
    fetch("/api/events")
      .then((r) => r.json())
      .then((json) => setEvents(json.events as EventItem[]))
      .catch(() => setEvents([]));
    loadGifts();
  }, [loadGifts]);

  useEffect(() => {
    if (!productId && products.length > 0) setProductId(products[0].id);
  }, [products, productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          recipientName,
          recipientCountry,
          address,
          message,
          eventId: eventId || undefined,
          origin: searchParams.get("origin") ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create gift");
      setCreatedGift(json.gift as Gift);
      setRecipientName("");
      setAddress("");
      setMessage("");
      loadGifts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create gift");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">🎁 Send a gift anywhere</h1>
      <p className="mt-1 text-slate-600">
        Pick the best global deal, add your loved one’s address, pay with PayPal and track it to
        their door.
      </p>

      {createdGift && (
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            ✅ Gift created for {createdGift.recipientName} ({formatMoney(createdGift.amountUSD, "USD")}{" "}
            via {createdGift.merchant}, {createdGift.originCountryName}). Complete the payment
            below.
          </div>
          <PaymentPanel
            gift={createdGift}
            onPaid={(gift) => router.push(`/gifts/${gift.id}`)}
          />
        </div>
      )}

      <form
        onSubmit={submit}
        className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">Product</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={inputClass}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name} — {p.brand}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Quantity</label>
          <input
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Recipient country
          </label>
          <CountrySelect value={recipientCountry} onChange={setRecipientCountry} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Recipient name
          </label>
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Link to event (optional)
          </label>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={inputClass}>
            <option value="">No event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.date})
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Delivery address
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city, postal code"
            className={inputClass}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Personal message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Happy birthday! 🎉"
            rows={2}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy || products.length === 0}
            className="w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "Finding the best global deal…" : "🎁 Create gift & continue to payment"}
          </button>
          {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
        </div>
      </form>

      <h2 className="mt-12 text-2xl font-bold text-slate-900">My gifts</h2>
      {gifts.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-4xl">💌</p>
          <p className="mt-2 font-semibold text-slate-900">No gifts sent yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first gift above — it takes less than a minute.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {gifts.map((gift) => (
            <div
              key={gift.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <span className="text-3xl">{gift.productEmoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {gift.productName} × {gift.quantity} → {gift.recipientName}{" "}
                  <span className="text-sm text-slate-500">
                    ({gift.recipientCountryName})
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {formatMoney(gift.amountUSD, "USD")} · via {gift.merchant} (
                  {gift.originCountryName}) · {formatDate(gift.createdAt)}
                  {gift.eventTitle ? ` · 📅 ${gift.eventTitle}` : ""}
                </p>
              </div>
              <StatusChip status={gift.status} />
              <Link
                href={`/gifts/${gift.id}`}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
              >
                Track gift
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GiftsPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-slate-500">Loading…</div>}
    >
      <GiftsContent />
    </Suspense>
  );
}
