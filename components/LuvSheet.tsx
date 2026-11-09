"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatMoney, type Bill } from "@/lib/types";

const PRESETS = [1000, 2500, 5000]; // cents

export default function LuvSheet({
  bill,
  onClose,
  onDone,
}: {
  bill: Bill;
  onClose: () => void;
  onDone: (updated: Bill, amountCents: number, message: string | null) => void;
}) {
  const [amount, setAmount] = useState<number>(Math.min(2500, bill.remaining_cents));
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseCustom = (v: string) => {
    setCustom(v);
    const cents = Math.round(parseFloat(v) * 100);
    if (Number.isFinite(cents) && cents > 0) setAmount(Math.min(cents, bill.remaining_cents));
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bills/${bill.id}/luv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: amount,
          giver_name: name || null,
          message: message || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send luv");
      onDone(data.bill as Bill, amount, message || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-30 bg-black/40 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 flex flex-col gap-5 shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-xl font-bold">
            Send luv to {bill.poster_name} <span aria-hidden>💗</span>
          </h2>
          <p className="text-sm text-stone-600">
            Paid directly to <span className="font-semibold">{bill.biller}</span>. {formatMoney(bill.remaining_cents)} left.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {PRESETS.filter((p) => p < bill.remaining_cents).map((p) => (
            <Chip key={p} active={amount === p && !custom} onClick={() => { setCustom(""); setAmount(p); }}>
              {formatMoney(p)}
            </Chip>
          ))}
          <Chip active={amount === bill.remaining_cents && !custom} onClick={() => { setCustom(""); setAmount(bill.remaining_cents); }}>
            All of it
          </Chip>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 focus-within:border-luv-400">
          <span className="text-stone-400">$</span>
          <input
            inputMode="decimal"
            placeholder="Custom amount"
            value={custom}
            onChange={(e) => chooseCustom(e.target.value)}
            className="flex-1 outline-none bg-transparent"
          />
        </label>

        <input
          placeholder="Your first name (optional — blank = anonymous)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-luv-400"
        />
        <input
          placeholder="A note for them (optional)"
          value={message}
          maxLength={200}
          onChange={(e) => setMessage(e.target.value)}
          className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-luv-400"
        />

        {error && <p className="text-sm text-luv-600">{error}</p>}

        <button
          disabled={busy || amount < 100}
          onClick={submit}
          className="rounded-full bg-luv-600 text-white py-3 font-semibold disabled:opacity-50 hover:bg-luv-700 active:scale-[0.98] transition"
        >
          {busy ? "Sending…" : `Send ${formatMoney(amount)} to ${bill.biller}`}
        </button>
        <button onClick={onClose} className="text-sm text-stone-500 -mt-2">
          Not right now
        </button>
      </motion.div>
    </motion.div>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-2 text-sm font-semibold border-2 transition ${
        active ? "border-luv-600 bg-luv-50 text-luv-700" : "border-stone-200 hover:border-luv-300"
      }`}
    >
      {children}
    </button>
  );
}
