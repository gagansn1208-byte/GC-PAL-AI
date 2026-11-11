import type { GiftStatus } from "./types";

export const STATUS_FLOW: GiftStatus[] = [
  "placed",
  "processing",
  "dispatched",
  "in_transit",
  "customs",
  "out_for_delivery",
  "delivered",
];

export const STATUS_LABELS: Record<GiftStatus, string> = {
  awaiting_payment: "Awaiting payment",
  placed: "Order placed",
  processing: "Processing",
  dispatched: "Dispatched",
  in_transit: "In transit",
  customs: "Customs clearance",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_ICONS: Record<GiftStatus, string> = {
  awaiting_payment: "💳",
  placed: "🧾",
  processing: "📦",
  dispatched: "🚚",
  in_transit: "✈️",
  customs: "🛃",
  out_for_delivery: "🛵",
  delivered: "🎉",
  cancelled: "❌",
};

export const STEP_NOTES: Partial<Record<GiftStatus, string>> = {
  processing: "Merchant is packing your gift.",
  dispatched: "Gift left the origin warehouse.",
  in_transit: "Shipment moving through the global logistics network.",
  customs: "Clearing customs in the destination country.",
  out_for_delivery: "Local courier is on the way to the recipient.",
  delivered: "Gift delivered. Recipient has been notified.",
};
