"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_EMOJI, CATEGORY_LABELS, type BillCategory, type Payout } from "@/lib/types";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as BillCategory[];

export default function PostBillForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    poster_name: "",
    city: "",
    state: "",
    biller: "",
    category: "utility" as BillCategory,
    payout: "biller" as Payout,
    amount: "",
    due_date: "",
    story: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount_cents: Math.round(parseFloat(form.amount || "0") * 100),
        due_date: form.due_date || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors(data.errors ?? [data.error ?? "Something went wrong"]);
      setBusy(false);
      return;
    }
    router.push(`/post/done?id=${encodeURIComponent(data.bill.id)}`);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name"><input required value={form.poster_name} onChange={set("poster_name")} className={inputCls} /></Field>
        <Field label="Category">
          <select value={form.category} onChange={set("category")} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="City"><input required value={form.city} onChange={set("city")} className={inputCls} /></Field>
        <Field label="State"><input required maxLength={2} placeholder="MN" value={form.state} onChange={set("state")} className={inputCls + " uppercase"} /></Field>
      </div>

      <Field label="Who is the bill from?">
        <input required placeholder="e.g. Xcel Energy" value={form.biller} onChange={set("biller")} className={inputCls} />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-stone-700 mb-1">Where should the money go?</legend>
        <PayoutOption
          value="biller"
          current={form.payout}
          onChange={(v) => setForm((f) => ({ ...f, payout: v }))}
          title={`Straight to ${form.biller.trim() || "the biller"}`}
          badge="Recommended"
          text="We pay the company on your behalf. Gets funded faster — swipers trust it more and can filter for it."
        />
        <PayoutOption
          value="bank"
          current={form.payout}
          onChange={(v) => setForm((f) => ({ ...f, payout: v }))}
          title="To my bank account"
          text="You pay the bill yourself. Needs extra identity verification and is labeled for swipers."
        />
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount owed">
          <div className="flex items-center gap-1">
            <span className="text-stone-400">$</span>
            <input required inputMode="decimal" placeholder="150.00" value={form.amount} onChange={set("amount")} className={inputCls} />
          </div>
        </Field>
        <Field label="Due date"><input type="date" value={form.due_date} onChange={set("due_date")} className={inputCls} /></Field>
      </div>

      <Field label={`What's going on? (${form.story.length}/400)`}>
        <textarea
          required
          rows={4}
          maxLength={400}
          placeholder="A few honest sentences. No need to overshare."
          value={form.story}
          onChange={set("story")}
          className={inputCls + " resize-none"}
        />
      </Field>

      {errors.length > 0 && (
        <ul className="rounded-xl bg-luv-50 border border-luv-200 text-luv-700 text-sm p-3 flex flex-col gap-1">
          {errors.map((e) => <li key={e}>• {e}</li>)}
        </ul>
      )}

      <button
        disabled={busy}
        className="rounded-full bg-luv-600 text-white py-3 font-semibold disabled:opacity-50 hover:bg-luv-700 active:scale-[0.98] transition"
      >
        {busy ? "Posting…" : "Post my bill"}
      </button>
      <p className="text-xs text-stone-500 text-center">
        Visible to swipers: your first name, city, biller, amount and story. Never your full name, address or account number.
      </p>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-luv-400 bg-white";

function PayoutOption({
  value,
  current,
  onChange,
  title,
  text,
  badge,
}: {
  value: Payout;
  current: Payout;
  onChange: (v: Payout) => void;
  title: string;
  text: string;
  badge?: string;
}) {
  const active = current === value;
  return (
    <label
      className={`flex gap-3 items-start rounded-xl border-2 p-3 cursor-pointer transition ${
        active ? "border-luv-500 bg-luv-50" : "border-stone-200 hover:border-luv-300"
      }`}
    >
      <input type="radio" name="payout" value={value} checked={active} onChange={() => onChange(value)} className="mt-1 accent-luv-600" />
      <span className="flex flex-col gap-0.5 text-sm">
        <span className="font-semibold flex items-center gap-2">
          {title}
          {badge && <span className="text-[10px] uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">{badge}</span>}
        </span>
        <span className="text-stone-600 font-normal">{text}</span>
      </span>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
      {label}
      {children}
    </label>
  );
}
