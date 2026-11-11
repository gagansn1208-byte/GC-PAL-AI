import Link from "next/link";
import Logo from "./Logo";

const LINKS = [
  { href: "/search", label: "Search" },
  { href: "/compare", label: "AI Compare" },
  { href: "/gifts", label: "Gifts" },
  { href: "/crowdticket", label: "CrowdTicket AI" },
  { href: "/events", label: "Events" },
  { href: "/transactions", label: "Transactions" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-anime-ink/80 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-anime-ink/80">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border-2 border-transparent px-3 py-1.5 transition hover:border-anime-ink hover:bg-anime-pink/15 hover:text-anime-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
