import fs from "node:fs";
import path from "node:path";
import type { CrowdGroup, EventItem, Gift, TicketBooking, Transaction } from "./types";

export interface DB {
  gifts: Gift[];
  events: EventItem[];
  transactions: Transaction[];
  crowdGroups: CrowdGroup[];
  bookings: TicketBooking[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let store: DB | null = null;

function load(): DB {
  if (store) return store;
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
      store = {
        gifts: Array.isArray(parsed.gifts) ? parsed.gifts : [],
        events: Array.isArray(parsed.events) ? parsed.events : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        crowdGroups: Array.isArray(parsed.crowdGroups) ? parsed.crowdGroups : [],
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      };
      return store;
    }
  } catch {
    //
  }
  store = { gifts: [], events: [], transactions: [], crowdGroups: [], bookings: [] };
  persist();
  return store;
}

export function persist(): void {
  if (!store) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

export function getDb(): DB {
  return load();
}
