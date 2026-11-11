"use client";

import { COUNTRIES } from "@/lib/seed";

export default function CountrySelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
    >
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.name} ({c.currency})
        </option>
      ))}
    </select>
  );
}
