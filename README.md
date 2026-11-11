# ✨ GC PAL AI — Global Commerce Pal

**Global shopping, gifting & group tickets. One search. Every country. The perfect gift. One crowd. The cheapest ticket.**

GC PAL AI is a full-stack Next.js app that lets you:

- 🌍 **Global product search** — search one product and see offers from merchants in 15 countries
- 💱 **Country-wise amounts** — every offer priced in the origin currency and converted to the destination currency with live FX rates
- 🤖 **AI deal comparison** — an AI analyst compares discounts, shipping, delivery speed and all-in totals across countries and recommends the best deal
- 🎁 **Worldwide gifting** — send any product as a gift to anyone in the world with a personal message
- 🎟️ **CrowdTicket AI — global group ticket booking & discounts**:
  - ✈️🚌🚄🎟️ **Flight, bus, train and event ticket discovery**
  - 👥 **Connect people booking similar journeys**
  - 🕒 **Two-hour group matching** — travellers departing within two hours of each other are pooled into one group
  - 🤖 **AI-powered group offer discovery** — tiered group discounts (up to 25%) with an AI analyst explaining the deal and the next discount tier
  - ✅ **Individual payment approvals** — every traveller approves their own share; the booking confirms when all approve
  - 🎫 **Booking confirmation & tracking** — mode-specific tracking from confirmation to arrival
- 📅 **Event management** — track birthdays, weddings and festivals worldwide and link gifts to events
- 🚚 **Gift tracking** — follow every gift through placed → processing → dispatched → in transit → customs → out for delivery → delivered
- 🧾 **Smart transaction history** — PayPal payments with spending insights, monthly charts and top destinations
- 💳 **PayPal sandbox checkout** — full create-order / capture flow using the PayPal Orders v2 API
- 🌸 **Anime-styled UI** — manga-panel cards, gradient titles, floating petals and playful motion
- 🛠️ **APIMatic-ready API** — a complete OpenAPI 3.0 spec (`openapi.yaml`) you can import into [APIMatic](https://apimatic.io) to generate SDKs

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS 4)
- [PayPal Orders v2 REST API](https://developer.paypal.com/api/orders/v2/) + [`@paypal/react-paypal-js`](https://github.com/paypal/react-paypal-js)
- Live exchange rates from [open.er-api.com](https://open.er-api.com) (with offline fallback)
- OpenAI-compatible LLM for the AI comparison engine (optional, falls back to a smart rules engine)
- JSON file store at `data/db.json` (zero-config persistence)

## Getting started

```bash
cd gc-pal-ai
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The app works out of the box in **demo mode**:

- Search and AI compare work without any keys (comparison falls back to the smart rules engine)
- Payments work via the **“Simulate payment (demo)”** button when PayPal credentials are not set

### Enable real PayPal sandbox checkout

1. Create a business account at the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/live)
2. Create a **REST API app** and copy the **Client ID** and **Secret**
3. Add them to `.env.local`:

```env
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_MODE=sandbox
```

4. Restart `npm run dev` — the gift payment panel now renders real PayPal buttons (use your sandbox buyer account to pay)

### Enable the LLM comparison engine

Add an OpenAI-compatible API key to `.env.local`:

```env
AI_API_KEY=sk-...
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

Any OpenAI-compatible endpoint works (OpenAI, OpenRouter, Azure, local gateways). Without a key, `/api/compare` uses the built-in deterministic rules engine and reports `engine: "rules"`.

## Try the full demo flow

1. **Search** — on the home page search “headphones”, pick destination country 🇮🇳 India → see country-wise prices in INR
2. **AI compare** — hit “AI compare” → full origin-country comparison table, best-deal banner, savings and AI tips
3. **Send a gift** — “Send as gift” → fill recipient + address → “Create gift & continue to payment” → pay with PayPal buttons or simulate
4. **Track** — you land on the gift tracking page; use “Advance tracking (demo)” to walk the shipment to “Delivered”
5. **Events** — add “Meera's Birthday” on 🇮🇳 India, then send a gift linked to it
6. **Transactions** — see totals, monthly spend chart, top destinations and the smart insight line
7. **CrowdTicket AI** — open **CrowdTicket AI** → pick a mode (flight/bus/train/event), enter from/to and a departure, add your name and seats → **Discover tickets** → **Start / join crowd** → approve members individually → **Confirm group booking** → **Advance tracking** to arrival

### How CrowdTicket AI works

1. **Discovery** — `/api/tickets/discover` returns carrier offers priced with the group discount for your party size
2. **Two-hour matching** — when you match, the engine joins an open group on the same mode/route whose departure is within **2 hours**, otherwise it creates a new one
3. **AI group offer** — the group offer is regenerated for the live seat count, with an AI (or rules) summary and tips on the next discount tier
4. **Individual approvals** — each member approves/declines their own share (`/api/crowd/{id}/approve`)
5. **Confirmation & tracking** — once approved, `/api/crowd/{id}/confirm` issues a booking with a `CT-XXXXXX` reference and mode-specific tracking (`/api/bookings/{id}/tracking`)

Group discount tiers: 2 seats → 5%, 3 → 8%, 5 → 12%, 8 → 18%, 12+ → 25%.

## API overview

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/products` | GET | Product catalog |
| `/api/search` | GET | Global search with best offer per product |
| `/api/compare` | GET | AI deal comparison across all origin countries |
| `/api/currency` | GET | Live FX rates |
| `/api/gifts` | GET, POST | List / create gifts |
| `/api/gifts/{id}` | GET, DELETE | Get / cancel a gift |
| `/api/gifts/{id}/tracking` | POST | Advance shipment tracking |
| `/api/gifts/{id}/simulate-payment` | POST | Demo payment without PayPal |
| `/api/events` | GET, POST | Worldwide event management |
| `/api/transactions` | GET | Smart transaction history + insights |
| `/api/paypal/config` | GET | Client config for the PayPal JS SDK |
| `/api/paypal/create-order` | POST | Create a PayPal order for a gift |
| `/api/paypal/capture-order` | POST | Capture an approved order |
| `/api/tickets/discover` | GET | Discover flight/bus/train/event offers with group pricing |
| `/api/crowd` | GET, POST | List / match-into-or-create a crowd group (2-hour window) |
| `/api/crowd/{id}` | GET | Group detail + booking |
| `/api/crowd/{id}/approve` | POST | Individual payment approval / decline |
| `/api/crowd/{id}/confirm` | POST | Confirm the group booking |
| `/api/bookings` | GET | List ticket bookings |
| `/api/bookings/{id}` | GET | Get a ticket booking |
| `/api/bookings/{id}/tracking` | POST | Advance booking tracking |

Full request/response schemas: [`openapi.yaml`](./openapi.yaml).

## Using APIMatic

The API is described as an OpenAPI 3.0 spec so you can generate SDKs and docs with [APIMatic](https://apimatic.io):

1. Sign up / log in to the [APIMatic Portal](https://portal.apimatic.io)
2. Choose **Import → OpenAPI** and upload `openapi.yaml` from this repo
3. APIMatic generates SDKs in 10+ languages (TypeScript, Python, Java, PHP, Go, Ruby, C#, …)
4. Publish a hosted API portal or export SDKs directly

Example (APIMatic-generated TypeScript SDK):

```ts
const client = new GcPalAiClient({ environment: "localhost" });
const results = await client.searchAndCompare.globalProductSearch({ q: "headphones", country: "IN" });
```

Optional CI integration — add the official APIMatic SDK generation action to your workflow:

```yaml
- uses: apimatic/generate-sdk-action@v1
  with:
    api-file: openapi.yaml
    platform: typescript
```

## Project structure

```
src/
  app/
    page.tsx                 Home (hero + global search)
    search/                  Global search results
    compare/                 AI deal comparison
    gifts/                   Send gifts + list + tracking detail
    crowdticket/             CrowdTicket AI — discovery, matching, approvals, tracking
    events/                  Worldwide event management
    transactions/            Smart transaction history
    api/                     REST API routes (see table above)
  components/                Nav, SearchBar, ProductCard, PaymentPanel, ...
  lib/
    seed.ts                  15 countries, 15 products, merchants, markups
    offers.ts               Deterministic global offer engine
    currency.ts              Live FX rates with fallback
    ai.ts                    LLM comparison engine + rules fallback
    tickets.ts               CrowdTicket engine: discovery, 2-hour matching, group tiers, AI, tracking
    crowd.ts                 Group lifecycle: create/join/refresh/confirm + booking
    paypal.ts                PayPal Orders v2 (auth, create, capture, history)
    db.ts                    JSON file store
    tracking.ts              Gift payment + tracking state machine
openapi.yaml                 APIMatic-ready OpenAPI 3.0 spec
data/db.json                 Runtime database (auto-created)
```

## Notes

- Prices, merchants, discounts and shipping in the catalog are **deterministic demo data** (seeded per product+origin) so comparisons are stable across reloads
- PayPal charges in **USD**; local currency amounts are display conversions
- The Transaction Search API (`/v1/reporting/transactions`) requires sandbox credentials and gracefully returns `null` when unavailable
