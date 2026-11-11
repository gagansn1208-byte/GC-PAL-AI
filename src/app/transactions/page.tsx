"use client";

import { useEffect, useState } from "react";
import StatusChip from "@/components/StatusChip";
import type { TransactionsResponse } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export default function TransactionsPage() {
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/transactions")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load transactions");
        setData(json as TransactionsResponse);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-slate-500">Loading transactions…</div>;
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  const { insights, transactions, paypal } = data;
  const maxMonthly = Math.max(...insights.monthly.map((m) => m.total), 1);
  const maxCountry = Math.max(...insights.byCountry.map((c) => c.total), 1);

  const cards = [
    { label: "Total sent", value: formatMoney(insights.total, "USD"), icon: "💸" },
    { label: "Gifts sent", value: String(insights.count), icon: "🎁" },
    { label: "Countries reached", value: String(insights.countries), icon: "🌍" },
    { label: "Average gift", value: formatMoney(insights.avg, "USD"), icon: "📊" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">🧾 Smart transaction history</h1>
      <p className="mt-1 text-slate-600">
        Every PayPal gift payment, analyzed with worldwide spending insights.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-2xl">{card.icon}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
          Smart insights
        </p>
        <p className="mt-2 text-base leading-relaxed text-slate-800">{insights.smartLine}</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Monthly spend (USD)</h2>
          <div className="mt-4 flex h-44 items-end gap-3">
            {insights.monthly.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-600">
                  {m.total > 0 ? formatMoney(m.total, "USD") : ""}
                </span>
                <div
                  className="w-full rounded-t-lg bg-indigo-500 transition-all"
                  style={{ height: `${Math.max((m.total / maxMonthly) * 100, 2)}%` }}
                />
                <span className="text-xs font-medium text-slate-500">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Top destinations</h2>
          {insights.byCountry.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No destination data yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {insights.byCountry.map((c) => (
                <div key={c.country}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {c.countryName} · {c.count} gift{c.count === 1 ? "" : "s"}
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatMoney(c.total, "USD")}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2.5 rounded-full bg-emerald-500"
                      style={{ width: `${(c.total / maxCountry) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {paypal && paypal.length > 0 && (
        <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-sm font-semibold text-sky-800">
            💳 PayPal sandbox activity synced ({paypal.length} records, last 30 days)
          </p>
        </div>
      )}

      <h2 className="mt-10 text-2xl font-bold text-slate-900">All transactions</h2>
      {transactions.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-4xl">🧾</p>
          <p className="mt-2 font-semibold text-slate-900">No transactions yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Send your first gift with PayPal to start your history.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">PayPal order</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 text-slate-700">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3">{t.description}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900">
                    {formatMoney(t.amountUSD, "USD")}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      ({formatMoney(t.amountLocal, t.currency)})
                    </span>
                  </td>
                  <td className="px-4 py-3">{t.destinationCountry}</td>
                  <td className="px-4 py-3">
                    <StatusChip status={t.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {t.paypalOrderId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
