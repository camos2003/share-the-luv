export type BillCategory =
  | "utility"
  | "rent"
  | "medical"
  | "tuition"
  | "phone"
  | "car"
  | "other";

export type BillStatus = "pending_verification" | "open" | "funded" | "paid";

export interface Bill {
  id: string;
  created_at: string;
  poster_name: string; // first name only, by design
  city: string;
  state: string;
  biller: string; // who actually gets paid, e.g. "Xcel Energy"
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
