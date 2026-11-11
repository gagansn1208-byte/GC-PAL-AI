import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listPayPalTransactions } from "@/lib/paypal";
import { findCountry } from "@/lib/seed";
import type { TransactionsResponse } from "@/lib/types";
import { formatMoney, round2 } from "@/lib/utils";

export async function GET() {
  const db = getDb();
  const transactions = [...db.transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const completed = transactions.filter((t) => t.status === "completed");
  const total = round2(completed.reduce((sum, t) => sum + t.amountUSD, 0));
  const count = completed.length;
  const countries = new Set(completed.map((t) => t.destinationCountry));
  const avg = count ? round2(total / count) : 0;

  const byCountryMap = new Map<string, { total: number; count: number }>();
  for (const t of completed) {
    const entry = byCountryMap.get(t.destinationCountry) ?? { total: 0, count: 0 };
    entry.total = round2(entry.total + t.amountUSD);
    entry.count += 1;
    byCountryMap.set(t.destinationCountry, entry);
  }
  const byCountry = [...byCountryMap.entries()]
    .map(([country, v]) => ({
      country,
      countryName: findCountry(country).name,
      total: v.total,
      count: v.count,
    }))
    .sort((a, b) => b.total - a.total);

  const monthly: Array<{ month: string; total: number }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const monthTotal = completed
      .filter((t) => {
        const td = new Date(t.createdAt);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
      })
      .reduce((sum, t) => sum + t.amountUSD, 0);
    monthly.push({ month: label, total: round2(monthTotal) });
  }

  const topCountry = byCountry[0]?.countryName ?? null;
  const topMonth = [...monthly].sort((a, b) => b.total - a.total)[0];
  let smartLine: string;
  if (count === 0) {
    smartLine = "No transactions yet. Send your first gift to unlock smart spending insights.";
  } else {
    smartLine =
      `You have sent ${count} gift${count === 1 ? "" : "s"} worth ${formatMoney(total, "USD")} ` +
      `to ${countries.size} countr${countries.size === 1 ? "y" : "ies"}. ` +
      (topCountry ? `${topCountry} is your top destination. ` : "") +
      (topMonth && topMonth.total > 0 ? `${topMonth.month} was your busiest month.` : "");
  }

  const paypal = await listPayPalTransactions(30);
  const response: TransactionsResponse = {
    transactions,
    paypal,
    insights: {
      total,
      count,
      countries: countries.size,
      avg,
      topCountry,
      smartLine,
      byCountry,
      monthly,
    },
  };
  return NextResponse.json(response);
}
