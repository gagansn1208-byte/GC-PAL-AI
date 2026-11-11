import Link from "next/link";
import SearchBar from "@/components/SearchBar";

const FEATURES = [
  {
    icon: "🌍",
    title: "Global product search",
    body: "Search one product and instantly see offers from merchants across 15 countries, all in one place.",
    href: "/search",
    cta: "Search worldwide",
  },
  {
    icon: "💱",
    title: "Country-wise amounts",
    body: "Every offer is priced in the origin country's currency and converted to yours with live exchange rates.",
    href: "/search",
    cta: "See prices per country",
  },
  {
    icon: "🤖",
    title: "AI deal comparison",
    body: "An AI analyst compares discounts, shipping and totals across countries and recommends the best deal.",
    href: "/compare",
    cta: "Compare deals",
  },
  {
    icon: "🎁",
    title: "Send gifts worldwide",
    body: "Send any product as a gift to anyone in the world with a personal message and PayPal checkout.",
    href: "/gifts",
    cta: "Send a gift",
  },
  {
    icon: "🎟️",
    title: "CrowdTicket AI — group bookings",
    body: "Flight, bus, train and event tickets. Match with people on the same journey within two hours, unlock AI group discounts, approve your own payment and track the booking.",
    href: "/crowdticket",
    cta: "Book as a crowd",
  },
  {
    icon: "📅",
    title: "Event management",
    body: "Track birthdays, weddings and festivals worldwide so no special day is ever missed.",
    href: "/events",
    cta: "Manage events",
  },
  {
    icon: "🚚",
    title: "Gift tracking & history",
    body: "Follow every gift from warehouse to doorstep and review smart insights on your spending.",
    href: "/transactions",
    cta: "View insights",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Search & compare",
    body: "Type any product, pick the destination country and compare offers from every origin country.",
  },
  {
    n: "2",
    title: "Pick the best deal",
    body: "The AI analyst ranks merchants by all-in total, discount, delivery speed and customs risk.",
  },
  {
    n: "3",
    title: "Pay & track",
    body: "Pay securely with PayPal, then track the gift all the way to your loved one's door.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b-2 border-anime-ink/80 bg-gradient-to-br from-anime-pink via-anime-purple to-anime-blue text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="max-w-3xl">
            <span className="anime-chip mb-4 bg-anime-yellow text-anime-ink">
              <span className="anime-sparkle">✨</span> GC PAL AI · Global Commerce Pal
            </span>
            <h1 className="text-5xl font-black leading-none tracking-tight drop-shadow-[3px_3px_0_rgba(30,27,58,0.85)] sm:text-6xl">
              GC PAL <span className="text-anime-yellow">AI</span>
            </h1>
            <p className="mt-3 text-xl font-black text-white/95 sm:text-2xl">
              One search. Every country. The perfect gift.
            </p>
            <p className="mt-3 text-lg text-white/90">
              Search any product worldwide, compare country-wise prices in local currencies, let AI
              find the best deal, and send gifts anywhere on Earth — paid with PayPal and tracked
              door to door. Plus group ticket bookings across flights, buses, trains and events.
            </p>
          </div>
          <div className="anime-panel mt-8 p-4">
            <SearchBar />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-white/90">
            <span>🌍 15 origin countries</span>
            <span>💱 Live FX rates</span>
            <span>🤖 AI deal engine</span>
            <span>🎟️ CrowdTicket AI group deals</span>
            <span>💳 PayPal sandbox checkout</span>
            <span>📦 End-to-end tracking</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-black text-anime-ink">Everything a global platform needs</h2>
        <p className="mt-1 text-anime-ink/70">Built in — no stitching five apps together.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="anime-card anime-card-hover group flex flex-col p-6"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-3 text-lg font-black text-anime-ink">{f.title}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-anime-ink/70">{f.body}</p>
              <span className="mt-4 text-sm font-black text-anime-purple group-hover:text-anime-pink">
                {f.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t-2 border-anime-ink/80 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-black text-anime-ink">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="anime-card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-anime-ink bg-anime-pink text-sm font-black text-anime-ink">
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg font-black text-anime-ink">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-anime-ink/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
