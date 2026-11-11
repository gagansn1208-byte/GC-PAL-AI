"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COUNTRIES } from "@/lib/seed";

export default function SearchBar({
  initialQ = "",
  initialCountry = "US",
}: {
  initialQ?: string;
  initialCountry?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [country, setCountry] = useState(initialCountry);

  const go = (path: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("country", country);
    router.push(`${path}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") go("/search");
        }}
        placeholder="Search any product… e.g. headphones, coffee, plush bear"
        className="flex-1 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500"
        aria-label="Destination country"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>
      <button
        onClick={() => go("/search")}
        className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Search worldwide
      </button>
      <button
        onClick={() => go("/compare")}
        className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        🤖 AI compare
      </button>
    </div>
  );
}
