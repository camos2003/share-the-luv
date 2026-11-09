"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readMyLuvs, type MyLuv } from "@/lib/myLuvs";
import { CATEGORY_EMOJI, formatMoney } from "@/lib/types";

export default function MyLuvsList() {
  const [luvs, setLuvs] = useState<MyLuv[] | null>(null);
  useEffect(() => setLuvs(readMyLuvs()), []);

  if (luvs === null) return <p className="text-sm text-stone-400">Loading…</p>;

  if (luvs.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-luv-100 p-8 text-center flex flex-col gap-3">
        <div className="text-4xl">🫶</div>
        <p className="text-stone-600 text-sm">Nothing here yet. Your first luv is one swipe away.</p>
        <Link href="/swipe" className="self-center rounded-full bg-luv-600 text-white px-5 py-2 text-sm font-semibold hover:bg-luv-700">
          Start swiping
        </Link>
      </div>
    );
  }

  const total = luvs.reduce((s, l) => s + l.amount_cents, 0);
  const funded = luvs.filter((l) => l.fully_funded).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat value={formatMoney(total)} label="sent" />
        <Stat value={String(luvs.length)} label={luvs.length === 1 ? "luv" : "luvs"} />
        <Stat value={String(funded)} label="bills closed" />
      </div>

      <ul className="flex flex-col gap-2">
        {luvs.map((l) => (
          <li key={l.id} className="rounded-2xl bg-white border border-luv-100 p-4 flex gap-3 items-start">
            <div className="text-2xl">{CATEGORY_EMOJI[l.category]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{l.poster_name}</span>
                <span className="font-bold text-luv-600">{formatMoney(l.amount_cents)}</span>
              </div>
              <div className="text-xs text-stone-500">
                to {l.biller} · {new Date(l.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {l.fully_funded && <span className="ml-2 text-emerald-700 font-semibold">· Bill closed ✓</span>}
              </div>
              {l.message && <p className="text-sm text-stone-600 mt-1 italic">“{l.message}”</p>}
              <StatusLine />
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-stone-400 text-center">
        History lives on this device for now. Sign-in and receipts are coming.
      </p>
    </div>
  );
}

function StatusLine() {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Pledged — we&apos;ll email you when the biller confirms
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white border border-luv-100 p-3 text-center">
      <div className="text-xl font-extrabold text-luv-600">{value}</div>
      <div className="text-[11px] text-stone-500">{label}</div>
    </div>
  );
}
