export type BillCategory =
  | "utility"
  | "rent"
  | "medical"
  | "tuition"
  | "phone"
  | "car"
  | "other";

export type BillStatus = "pending_verification" | "open" | "funded" | "paid";

/** Where luvs actually go. "biller" = we pay the company directly (default, strongest trust signal). */
export type Payout = "biller" | "bank";

export interface Bill {
  id: string;
  created_at: string;
  poster_name: string; // first name only, by design
  city: string;
  state: string;
  biller: string; // the company the bill is from, e.g. "Xcel Energy"
  payout: Payout; // biller = paid to the company; bank = paid to the poster's bank account
  category: BillCategory;
  amount_cents: number;
  remaining_cents: number;
  due_date: string | null;
  story: string;
  verified: boolean;
  status: BillStatus;
  luv_count: number;
}

export interface Luv {
  id: string;
  created_at: string;
  bill_id: string;
  giver_name: string | null; // null = anonymous
  amount_cents: number;
  message: string | null;
  payment_status: "pledged" | "captured" | "sent_to_biller";
}

export interface NewBillInput {
  poster_name: string;
  city: string;
  state: string;
  biller: string;
  payout: Payout;
  category: BillCategory;
  amount_cents: number;
  due_date: string | null;
  story: string;
}

export interface NewLuvInput {
  bill_id: string;
  giver_name: string | null;
  amount_cents: number;
  message: string | null;
}

export const CATEGORY_LABELS: Record<BillCategory, string> = {
  utility: "Utility",
  rent: "Rent",
  medical: "Medical",
  tuition: "Tuition",
  phone: "Phone",
  car: "Car",
  other: "Other",
};

export const CATEGORY_EMOJI: Record<BillCategory, string> = {
  utility: "💡",
  rent: "🏠",
  medical: "🩺",
  tuition: "🎓",
  phone: "📱",
  car: "🚗",
  other: "🧾",
};

export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export const PAYOUT_LABELS: Record<Payout, { short: string; long: (name: string, biller: string) => string }> = {
  biller: {
    short: "Paid to biller",
    long: (_name, biller) => `Paid directly to ${biller}. Never touches a personal account.`,
  },
  bank: {
    short: "Paid to poster",
    long: (name, biller) => `Sent to ${name}'s bank account; ${name} pays ${biller}.`,
  },
};
