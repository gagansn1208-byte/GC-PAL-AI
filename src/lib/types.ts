export interface Country {
  code: string;
  name: string;
  currency: string;
  flag: string;
  region: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  emoji: string;
  baseUSD: number;
  rating: number;
  reviews: number;
  tags: string[];
}

export interface Offer {
  origin: string;
  originName: string;
  flag: string;
  currency: string;
  merchant: string;
  priceUSD: number;
  priceLocal: number;
  discountPct: number;
  shippingUSD: number;
  shippingDays: number;
  totalUSD: number;
  totalDest: number;
  destCurrency: string;
  inStock: boolean;
}

export interface SearchItem {
  product: Product;
  offer: Offer;
  offersCount: number;
  worstTotalUSD: number;
  savingsUSD: number;
}

export interface SearchResponse {
  query: string;
  destination: Country;
  items: SearchItem[];
}

export interface CompareResult {
  query: string;
  product: Product;
  destination: Country;
  rows: Offer[];
  best: Offer;
  worst: Offer;
  savingsUSD: number;
  engine: "llm" | "rules";
  summary: string;
  tips: string[];
}

export type GiftStatus =
  | "awaiting_payment"
  | "placed"
  | "processing"
  | "dispatched"
  | "in_transit"
  | "customs"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface TrackingStep {
  status: GiftStatus;
  at: string;
  note: string;
}

export interface Gift {
  id: string;
  productId: string;
  productName: string;
  productEmoji: string;
  merchant: string;
  originCountry: string;
  originCountryName: string;
  recipientName: string;
  recipientCountry: string;
  recipientCountryName: string;
  address: string;
  message: string;
  eventId?: string;
  eventTitle?: string;
  quantity: number;
  currency: string;
  amountLocal: number;
  amountUSD: number;
  status: GiftStatus;
  trackingSteps: TrackingStep[];
  etaDays: number;
  paypalOrderId?: string;
  createdAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  type: string;
  date: string;
  country: string;
  countryName: string;
  notes: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  giftId?: string;
  type: "gift";
  description: string;
  amountUSD: number;
  currency: string;
  amountLocal: number;
  destinationCountry: string;
  status: "completed" | "pending" | "refunded";
  paypalOrderId?: string;
  createdAt: string;
}

export interface PayPalTxn {
  id: string;
  status: string;
  amountUSD: number | null;
  time: string;
}

export type TicketMode = "flight" | "bus" | "train" | "event";

export interface TicketOffer {
  id: string;
  mode: TicketMode;
  carrier: string;
  carrierEmoji: string;
  fromCity: string;
  toCity: string;
  departAt: string;
  arriveAt: string;
  durationMin: number;
  soloUSD: number;
  groupSize: number;
  groupDiscountPct: number;
  groupPerPersonUSD: number;
  groupTotalUSD: number;
  savingsUSD: number;
  seatsLeft: number;
  perks: string[];
  live: boolean;
}

export type GroupStatus = "matching" | "pending_approvals" | "confirmed" | "cancelled";

export type MemberPaymentStatus = "pending" | "approved" | "declined";

export interface GroupMember {
  id: string;
  name: string;
  seats: number;
  paymentStatus: MemberPaymentStatus;
  joinedAt: string;
}

export interface CrowdGroup {
  id: string;
  mode: TicketMode;
  fromCity: string;
  toCity: string;
  departAt: string;
  windowStart: string;
  windowEnd: string;
  capacity: number;
  status: GroupStatus;
  members: GroupMember[];
  offer: TicketOffer;
  engine: "llm" | "rules";
  aiSummary: string;
  aiTips: string[];
  bookingId?: string;
  createdAt: string;
}

export type BookingStatus =
  | "pending_payments"
  | "confirmed"
  | "ticketed"
  | "checked_in"
  | "boarding"
  | "in_transit"
  | "arrived"
  | "cancelled";

export interface BookingStep {
  status: BookingStatus;
  at: string;
  note: string;
}

export interface TicketBooking {
  id: string;
  groupId: string;
  reference: string;
  mode: TicketMode;
  carrier: string;
  carrierEmoji: string;
  fromCity: string;
  toCity: string;
  departAt: string;
  arriveAt: string;
  seats: number;
  perPersonUSD: number;
  totalUSD: number;
  savingsUSD: number;
  status: BookingStatus;
  trackingSteps: BookingStep[];
  createdAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  paypal: PayPalTxn[] | null;
  insights: {
    total: number;
    count: number;
    countries: number;
    avg: number;
    topCountry: string | null;
    smartLine: string;
    byCountry: Array<{ country: string; countryName: string; total: number; count: number }>;
    monthly: Array<{ month: string; total: number }>;
  };
}
