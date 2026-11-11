"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import { findCountry } from "@/lib/seed";
import type { SearchResponse } from "@/lib/types";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const country = searchParams.get("country") ?? "US";
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query: string, dest: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("country", dest);
      const res = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setData(json as SearchResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(q, country);
  }, [q, country, load]);

  const destination = data?.destination ?? findCountry(country);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Global shopping search</h1>
      <p className="mt-1 text-slate-600">
        One product, every country — prices converted with live FX rates.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <SearchBar initialQ={q} initialCountry={country} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-slate-700">Shipping to:</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
          {destination.flag} {destination.name} ({destination.currency})
        </span>
        {q && <span className="text-slate-500">for “{q}”</span>}
      </div>

      {loading && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-4xl">🔎</p>
          <p className="mt-2 font-semibold text-slate-900">No products matched “{q}”</p>
          <p className="mt-1 text-sm text-slate-500">
            Try “headphones”, “coffee”, “plush bear”, “smartwatch”, “perfume”…
          </p>
        </div>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <ProductCard key={item.product.id} item={item} country={country} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-slate-500">Loading…</div>}
    >
      <SearchContent />
    </Suspense>
  );
}
