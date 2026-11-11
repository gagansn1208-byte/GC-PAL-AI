import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GC PAL AI — Global Shopping, Gifting & Group Tickets",
  applicationName: "GC PAL AI",
  description:
    "GC PAL AI (Global Commerce Pal) — search products worldwide, compare country-wise prices with AI, send gifts anywhere with PayPal, track every delivery, manage events and book group tickets with CrowdTicket AI.",
};

const PETALS = ["🌸", "🌸", "✨", "🌸", "🌷", "✨", "🌸", "🌺", "✨", "🌸"];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="anime-backdrop" aria-hidden>
          {PETALS.map((petal, i) => (
            <span
              key={i}
              className="petal"
              style={{
                left: `${6 + i * 9.5}%`,
                animationDuration: `${9 + (i % 4) * 2.5}s`,
                animationDelay: `${i * 1.4}s`,
                fontSize: `${1 + (i % 3) * 0.25}rem`,
              }}
            >
              {petal}
            </span>
          ))}
        </div>
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="mt-10 border-t-2 border-anime-ink/80 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-6 text-center text-xs font-medium text-anime-ink/70 sm:flex-row sm:justify-between sm:text-left">
            <p>🌸 GC PAL AI — one search, every country, every journey.</p>
            <p>Global Commerce Pal · Next.js · PayPal sandbox · APIMatic-ready API</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
