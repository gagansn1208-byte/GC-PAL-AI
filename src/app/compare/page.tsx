"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import { findCountry } from "@/lib/seed";
import type { CompareResult } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

function CompareContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const country = searchParams.get("country") ?? "US";
  const [data, setData] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ q, country });
    fetch(`/api/compare?${params.toString()}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Comparison failed");
        setData(json as CompareResult);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Comparison failed")
      )
      .finally(() => setLoading(false));
  }, [q, country]);

  const destination = data?.destination ?? findCountry(country);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">🤖 AI deal comparison</h1>
      <p className="mt-1 text-slate-600">
        One product compared across every origin country — discounts, shipping, customs and totals.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <SearchBar initialQ={q} initialCountry={country} />
      </div>

      {!q && (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-4xl">🧭</p>
          <p className="mt-2 font-semibold text-slate-900">
            Type a product above and hit “AI compare”
          </p>
        </div>
      )}

      {q && loading && (
        <div className="mt-10 space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      )}

      {q && !loading && error && (
        <div className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          {error}
        </div>
      )}

      {q && !loading && !error && data && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-5xl">{data.product.emoji}</span>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {data.product.brand} · {data.product.category} · ★ {data.product.rating}
              </p>
              <h2 className="text-xl font-bold text-slate-900">{data.product.name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                Shipping to {destination.flag} {destination.name} ({destination.currency})
              </p>
            </div>
            <Link
              href={`/gifts?product=${data.product.id}&country=${country}&origin=${data.best.origin}`}
              className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              🎁 Send best deal as gift
            </Link>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {data.engine === "llm" ? "AI analyst" : "Smart rules engine"}
              </span>
              <span className="text-xs font-medium text-indigo-900/70">
                {data.engine === "llm"
                  ? "LLM-powered global deal analysis"
                  : "Set AI_API_KEY in .env.local for LLM-powered analysis"}
              </span>
            </div>
            <p className="mt-3 text-base leading-relaxed text-slate-800">{data.summary}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {data.tips.map((tip, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-indigo-100 bg-white/80 px-3 py-2 text-sm text-slate-700"
                >
                  💡 {tip}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">
                Best: {data.best.merchant} ({data.best.flag} {data.best.originName}) ·{" "}
                {formatMoney(data.best.totalUSD, "USD")} · ~{data.best.shippingDays} days
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-800">
                Save {formatMoney(data.savingsUSD, "USD")} vs priciest
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Origin country</th>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Local price</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Shipping</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Total USD</th>
                  <th className="px-4 py-3">Total ({destination.currency})</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr
                    key={row.origin}
                    className={
                      i === 0
                        ? "border-t border-emerald-200 bg-emerald-50/60 font-semibold text-slate-900"
                        : "border-t border-slate-100 text-slate-700"
                    }
                  >
                    <td className="px-4 py-3">
                      {row.flag} {row.originName}
                      {i === 0 && (
                        <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          Best
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{row.merchant}</td>
                    <td className="px-4 py-3">{formatMoney(row.priceLocal, row.currency)}</td>
                    <td className="px-4 py-3">{row.discountPct}%</td>
                    <td className="px-4 py-3">
                      {row.shippingUSD === 0 ? "Free" : formatMoney(row.shippingUSD, "USD")}
                    </td>
                    <td className="px-4 py-3">~{row.shippingDays}</td>
                    <td className="px-4 py-3">{formatMoney(row.totalUSD, "USD")}</td>
                    <td className="px-4 py-3">
                      {formatMoney(row.totalDest, row.destCurrency)}
                    </td>
                    <td className="px-4 py-3">
                      {row.inStock ? (
                        <span className="text-emerald-700">In stock</span>
                      ) : (
                        <span className="text-rose-500">Out</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-slate-500">Loading…</div>}
    >
      <CompareContent />
    </Suspense>
  );
}
