interface TokenResponse {
  access_token?: string;
}

interface OrderResponse {
  id?: string;
  status?: string;
  message?: string;
}

interface TxnDetails {
  transaction_info?: {
    transaction_id?: string;
    transaction_status?: string;
    transaction_initiation_date?: string;
    transaction_amount?: { currency_code?: string; value?: string };
  };
}

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function paypalClientId(): string | null {
  return process.env.PAYPAL_CLIENT_ID || null;
}

export function paypalMode(): "sandbox" | "live" {
  return (process.env.PAYPAL_MODE || "sandbox") === "live" ? "live" : "sandbox";
}

function baseUrl(): string {
  return process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
}

async function accessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal credentials are not configured");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(`PayPal auth failed (${res.status})`);
  }
  return data.access_token;
}

export async function createOrder(input: {
  referenceId: string;
  amountUSD: number;
  description: string;
}): Promise<string> {
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.referenceId,
          custom_id: input.referenceId,
          description: input.description.slice(0, 127),
          amount: { currency_code: "USD", value: input.amountUSD.toFixed(2) },
        },
      ],
    }),
    cache: "no-store",
  });
  const data = (await res.json()) as OrderResponse;
  if (!res.ok || !data.id) {
    throw new Error(data.message || `PayPal create order failed (${res.status})`);
  }
  return data.id;
}

export async function captureOrder(orderId: string): Promise<string> {
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const data = (await res.json()) as OrderResponse;
  if (!res.ok) {
    throw new Error(data.message || `PayPal capture failed (${res.status})`);
  }
  return data.status ?? "UNKNOWN";
}

export async function listPayPalTransactions(
  days = 30
): Promise<Array<{ id: string; status: string; amountUSD: number | null; time: string }> | null> {
  if (!paypalConfigured()) return null;
  try {
    const token = await accessToken();
    const end = new Date();
    const start = new Date(Date.now() - days * 86400000);
    const url = `${baseUrl()}/v1/reporting/transactions?start_date=${start.toISOString()}&end_date=${end.toISOString()}&fields=all&page_size=100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { transaction_details?: TxnDetails[] };
    return (data.transaction_details ?? []).map((t) => {
      const info = t.transaction_info ?? {};
      const amt = info.transaction_amount;
      return {
        id: info.transaction_id ?? "unknown",
        status: info.transaction_status ?? "UNKNOWN",
        amountUSD:
          amt && amt.currency_code === "USD" && amt.value ? Number(amt.value) : null,
        time: info.transaction_initiation_date ?? "",
      };
    });
  } catch {
    return null;
  }
}
