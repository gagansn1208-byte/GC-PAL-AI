"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PaymentPanel from "@/components/PaymentPanel";
import StatusChip from "@/components/StatusChip";
import { STATUS_FLOW, STATUS_ICONS, STATUS_LABELS } from "@/lib/status";
import type { Gift } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/utils";

export default function GiftTracking({ id }: { id: string }) {
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/gifts/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gift not found");
      setGift(json.gift as Gift);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gift not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async () => {
    if (!gift) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/gifts/${gift.id}/tracking`, { method: "POST" });
      const json = await res.json();
      if (res.ok) setGift(json.gift as Gift);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-slate-500">Loading gift…</div>;
  }
  if (error || !gift) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          {error}
        </div>
        <div className="mt-4 text-center">
          <Link href="/gifts" className="text-sm font-semibold text-indigo-600">
            ← Back to gifts
          </Link>
        </div>
      </div>
    );
  }

  const paid = gift.status !== "awaiting_payment";
  const stepMap = new Map(gift.trackingSteps.map((s) => [s.status, s]));
  const canAdvance = paid && gift.status !== "delivered" && gift.status !== "cancelled";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="text-5xl">{gift.productEmoji}</span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold text-slate-900">
            {gift.productName} × {gift.quantity}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            To <strong>{gift.recipientName}</strong> · {gift.recipientCountryName} · from{" "}
            {gift.merchant} ({gift.originCountryName})
            {gift.eventTitle ? ` · 📅 ${gift.eventTitle}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <StatusChip status={gift.status} />
            <span className="text-slate-500">ETA ~{gift.etaDays} days from dispatch</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{formatMoney(gift.amountUSD, "USD")}</p>
          <p className="text-xs text-slate-500">
            ≈ {formatMoney(gift.amountLocal, gift.currency)} {gift.currency}
          </p>
        </div>
      </div>

      {!paid && (
        <div className="mt-6">
          <PaymentPanel gift={gift} onPaid={(g) => setGift(g)} />
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Delivery details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Recipient</dt>
              <dd className="text-slate-900">
                {gift.recipientName}, {gift.recipientCountryName}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Address</dt>
              <dd className="text-slate-900">{gift.address}</dd>
            </div>
            {gift.message && (
              <div>
                <dt className="font-medium text-slate-500">Message</dt>
                <dd className="rounded-xl bg-indigo-50 px-3 py-2 text-indigo-900">
                  “{gift.message}”
                </dd>
              </div>
            )}
            {gift.paypalOrderId && (
              <div>
                <dt className="font-medium text-slate-500">PayPal order</dt>
                <dd className="font-mono text-xs text-slate-700">{gift.paypalOrderId}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Tracking timeline</h2>
          <ol className="mt-4 space-y-4">
            {STATUS_FLOW.map((status) => {
              const step = stepMap.get(status);
              const done = Boolean(step);
              const current = gift.status === status;
              return (
                <li key={status} className="flex items-start gap-3">
                  <span
                    className={
                      done
                        ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm"
                        : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm opacity-50"
                    }
                  >
                    {STATUS_ICONS[status]}
                  </span>
                  <div className={done ? "" : "opacity-50"}>
                    <p className="text-sm font-semibold text-slate-900">
                      {STATUS_LABELS[status]}
                      {current && (
                        <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-700">
                          Current
                        </span>
                      )}
                    </p>
                    {step && (
                      <p className="text-xs text-slate-500">
                        {formatDateTime(step.at)} — {step.note}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {canAdvance && (
            <button
              onClick={advance}
              disabled={busy}
              className="mt-5 w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {busy ? "Updating…" : "Advance tracking (demo)"}
            </button>
          )}
          <div className="mt-4 text-center">
            <Link href="/gifts" className="text-sm font-semibold text-indigo-600">
              🎁 Send another gift
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
