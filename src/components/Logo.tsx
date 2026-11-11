import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const badge = size === "lg" ? "h-14 w-14 text-2xl" : "h-9 w-9 text-sm";
  const word = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className={`anime-logo-badge ${badge}`}>
        <span className="relative z-10">GC</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`anime-title font-black tracking-tight ${word}`}>GC PAL AI</span>
        <span className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-anime-ink/50">
          Global Commerce Pal
        </span>
      </span>
    </Link>
  );
}
