import { STATUS_LABELS } from "@/lib/status";
import type { GiftStatus } from "@/lib/types";
import { cx } from "@/lib/utils";

const STYLES: Record<string, string> = {
  awaiting_payment: "bg-amber-100 text-amber-800",
  placed: "bg-sky-100 text-sky-800",
  processing: "bg-sky-100 text-sky-800",
  dispatched: "bg-blue-100 text-blue-800",
  in_transit: "bg-indigo-100 text-indigo-800",
  customs: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
  completed: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  refunded: "bg-rose-100 text-rose-800",
};

export default function StatusChip({ status }: { status: string }) {
  const label = STATUS_LABELS[status as GiftStatus] ?? status;
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        STYLES[status] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {label}
    </span>
  );
}
