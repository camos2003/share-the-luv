"use client";

// Giver-side history, stored in the browser until auth exists.
// Deliberately tiny: once Supabase Auth lands, this becomes a `luvs` query by giver_id.

import type { Bill } from "./types";

export interface MyLuv {
  id: string;
  at: string; // ISO
  bill_id: string;
  poster_name: string;
  biller: string;
  category: Bill["category"];
  amount_cents: number;
  fully_funded: boolean;
  message: string | null;
}

const KEY = "stl.myLuvs.v1";

export function readMyLuvs(): MyLuv[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MyLuv[]) : [];
  } catch {
    return [];
  }
}

export function recordMyLuv(entry: MyLuv) {
  try {
    const all = [entry, ...readMyLuvs()].slice(0, 200);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable — history is a convenience, not critical */
  }
}
