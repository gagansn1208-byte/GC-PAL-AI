"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useEffect, useState } from "react";
import type { Gift } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

interface PayPalConfig {
  configured: boolean;
  clientId: string | null;
  currency: string;
  mode: string;
}

export default function PaymentPanel({
  gift,
  onPaid,
}: {
  gift: Gift;
  onPaid: (gift: Gift) => void;
}) {
  const [config, setConfig] = useState<PayPalConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/paypal/config")
      .then((r) => r.json())
      .then((data: PayPalConfig) => setConfig(data))
      .catch(() => setConfig({ configured: false, clientId: null, currency: "USD", mode: "sandbox" }));
  }, []);

  const simulate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/gifts/${gift.id}/simulate-payment`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment simulation failed");
      onPaid(data.gift as Gift);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment simulation failed");
    } finally {
      setBusy(false);
    }
  };

  if (gift.status !== "awaiting_payment") return null;

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">Complete payment</h3>
        <p className="text-sm font-bold text-slate-900">
          {formatMoney(gift.amountUSD, "USD")}{" "}
          <span className="text-xs font-normal text-slate-500">
            · charged in USD ({formatMoney(gift.amountLocal, gift.currency)} {gift.currency})
          </span>
        </p>
      </div>

      {config === null && (
        <p className="mt-4 text-sm text-slate-500">Loading payment options…</p>
      )}

      {config && config.configured && config.clientId ? (
        <div className="mt-4">
          <PayPalScriptProvider options={{ clientId: config.clientId, currency: "USD" }}>
            <PayPalButtons
              style={{ layout: "vertical", shape: "pill", color: "gold", label: "paypal" }}
              createOrder={async () => {
                const res = await fetch("/api/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ giftId: gift.id }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Could not create PayPal order");
                return data.orderId as string;
              }}
              onApprove={async (data) => {
                const res = await fetch("/api/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: data.orderID, giftId: gift.id }),
                });
                const json = await res.json();
                if (json.ok) {
                  onPaid(json.gift as Gift);
                } else {
                  setError(json.error || json.status || "Payment could not be captured");
                }
              }}
              onError={(err: Record<string, unknown>) =>
                setError(String(err?.message ?? "PayPal error"))
              }
            />
          </PayPalScriptProvider>
        </div>
      ) : (
        config && (
          <div className="mt-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              PayPal sandbox credentials are not set. Add <code>PAYPAL_CLIENT_ID</code> and{" "}
              <code>PAYPAL_CLIENT_SECRET</code> to <code>.env.local</code> to enable real sandbox
              checkout — or simulate the payment to explore the full flow.
            </div>
            <button
              onClick={simulate}
              disabled={busy}
              className="mt-3 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {busy ? "Processing…" : "💳 Simulate payment (demo)"}
            </button>
          </div>
        )
      )}

      {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
}
