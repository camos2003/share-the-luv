import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: { amount_cents?: number; giver_name?: string | null; message?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount_cents = Math.round(Number(body.amount_cents ?? 0));
  if (!Number.isFinite(amount_cents) || amount_cents < 100) {
    return NextResponse.json({ error: "Minimum luv is $1." }, { status: 422 });
  }
  const giver_name = body.giver_name ? String(body.giver_name).trim().slice(0, 40) || null : null;
  const message = body.message ? String(body.message).trim().slice(0, 200) || null : null;

  try {
    // TODO(stripe): create a PaymentIntent here, then record the luv on webhook success.
    const result = await getStore().addLuv({ bill_id: id, amount_cents, giver_name, message });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
