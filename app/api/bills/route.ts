import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import type { BillCategory, NewBillInput, Payout } from "@/lib/types";

const CATEGORIES: BillCategory[] = ["utility", "rent", "medical", "tuition", "phone", "car", "other"];

export async function GET() {
  const bills = await getStore().listOpenBills();
  return NextResponse.json({ bills });
}

export async function POST(req: Request) {
  let body: Partial<NewBillInput> & { amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const poster_name = String(body.poster_name ?? "").trim().split(/\s+/)[0]; // first name only
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim().toUpperCase().slice(0, 2);
  const biller = String(body.biller ?? "").trim();
  const story = String(body.story ?? "").trim();
  const category = body.category as BillCategory;
  const payout: Payout = body.payout === "bank" ? "bank" : "biller";
  const amount_cents = Math.round(Number(body.amount_cents ?? (body.amount ?? 0) * 100));
  const due_date = body.due_date ? String(body.due_date) : null;

  const errors: string[] = [];
  if (!poster_name) errors.push("First name is required.");
  if (!city) errors.push("City is required.");
  if (state.length !== 2) errors.push("State must be a 2-letter code.");
  if (!biller) errors.push("Biller is required — who actually gets paid?");
  if (!CATEGORIES.includes(category)) errors.push("Pick a category.");
  if (!Number.isFinite(amount_cents) || amount_cents < 500) errors.push("Amount must be at least $5.");
  if (amount_cents > 500_000) errors.push("Amount must be $5,000 or less for now.");
  if (story.length < 20) errors.push("Tell us a little more (20+ characters).");
  if (story.length > 400) errors.push("Keep the story under 400 characters.");
  if (errors.length) return NextResponse.json({ errors }, { status: 422 });

  const bill = await getStore().createBill({
    poster_name,
    city,
    state,
    biller,
    payout,
    category,
    amount_cents,
    due_date,
    story,
  });
  return NextResponse.json({ bill }, { status: 201 });
}
