"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_EMOJI, CATEGORY_LABELS, type BillCategory } from "@/lib/types";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as BillCategory[];

export default function PostBillForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    poster_name: "",
    city: "",
    state: "",
    biller: "",
    category: "utility" as BillCategory,
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
    router.push("/swipe");
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

      <Field label="Who gets paid? (the biller)">
        <input required placeholder="e.g. Xcel Energy" value={form.biller} onChange={set("biller")} className={inputCls} />
      </Field>

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
        Next step (not built yet): upload the bill so we can verify it before it goes live.
      </p>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-luv-400 bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
      {label}
      {children}
    </label>
  );
}
