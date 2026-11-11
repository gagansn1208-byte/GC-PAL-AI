import { persist } from "./db";
import { STATUS_FLOW, STEP_NOTES } from "./status";
import type { Gift, Transaction } from "./types";

export function markGiftPaid(gift: Gift): Transaction {
  const now = new Date().toISOString();
  gift.status = "placed";
  gift.trackingSteps.push({
    status: "placed",
    at: now,
    note: `Payment confirmed. Order placed with ${gift.merchant} (${gift.originCountryName}).`,
  });
  const transaction: Transaction = {
    id: crypto.randomUUID(),
    giftId: gift.id,
    type: "gift",
    description: `Gift: ${gift.productName} → ${gift.recipientName} (${gift.recipientCountryName})`,
    amountUSD: gift.amountUSD,
    currency: gift.currency,
    amountLocal: gift.amountLocal,
    destinationCountry: gift.recipientCountry,
    status: "completed",
    paypalOrderId: gift.paypalOrderId,
    createdAt: now,
  };
  return transaction;
}

export function advanceTracking(gift: Gift): Gift {
  const idx = STATUS_FLOW.indexOf(gift.status);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return gift;
  const next = STATUS_FLOW[idx + 1];
  gift.status = next;
  gift.trackingSteps.push({
    status: next,
    at: new Date().toISOString(),
    note: STEP_NOTES[next] ?? "Status updated.",
  });
  persist();
  return gift;
}
