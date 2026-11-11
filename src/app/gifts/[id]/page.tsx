import { Suspense } from "react";
import GiftTracking from "./GiftTracking";

async function Gift({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GiftTracking id={id} />;
}

export default function GiftTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-4xl px-4 py-10 text-slate-500">Loading gift…</div>}
    >
      <Gift params={params} />
    </Suspense>
  );
}
