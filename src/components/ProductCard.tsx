"use client";

import Link from "next/link";
import type { SearchItem } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export default function ProductCard({
  item,
  country,
}: {
  item: SearchItem;
  country: string;
}) {
  const { product, offer } = item;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-4xl">{product.emoji}</span>
        <span
          className={
            offer.discountPct >= 20
              ? "rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700"
              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
          }
        >
          {offer.discountPct}% off
        </span>
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        {product.brand} · {product.category}
      </p>
      <h3 className="mt-0.5 text-base font-semibold leading-snug text-slate-900">{product.name}</h3>
      <p className="mt-1 text-xs text-slate-500">
        ★ {product.rating} · {product.reviews.toLocaleString()} reviews
      </p>
      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="text-2xl font-bold text-slate-900">
          {formatMoney(offer.totalDest, offer.destCurrency)}
        </p>
        <p className="text-xs text-slate-500">
          ≈ {formatMoney(offer.totalUSD, "USD")} all-in incl. shipping
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {offer.flag} Ships from {offer.originName} via {offer.merchant} · ~{offer.shippingDays}{" "}
          days
        </p>
      </div>
      <p className="mt-2 text-xs font-medium text-emerald-700">
        {item.offersCount} global offers · save {formatMoney(item.savingsUSD, "USD")} vs priciest
        origin
      </p>
      <div className="mt-auto flex gap-2 pt-4">
        <Link
          href={`/compare?q=${encodeURIComponent(product.name)}&country=${country}`}
          className="flex-1 rounded-full bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-slate-700"
        >
          Compare deals
        </Link>
        <Link
          href={`/gifts?product=${product.id}&country=${country}`}
          className="flex-1 rounded-full bg-indigo-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-indigo-700"
        >
          🎁 Send as gift
        </Link>
      </div>
    </div>
  );
}
