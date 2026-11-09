// Data access layer. Picks Supabase when env vars are set, otherwise an
// in-memory demo store seeded from lib/demo.ts. Everything in the app goes
// through this file, so swapping backends later is a one-file change.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_BILLS } from "./demo";
import type { Bill, Luv, NewBillInput, NewLuvInput } from "./types";

export interface Store {
  listOpenBills(): Promise<Bill[]>;
  getBill(id: string): Promise<Bill | null>;
  createBill(input: NewBillInput): Promise<Bill>;
  addLuv(input: NewLuvInput): Promise<{ luv: Luv; bill: Bill }>;
  addNotifySignup(email: string): Promise<void>;
}

// ---------- Demo (in-memory) ----------

function demoStore(): Store {
  // Module-level state survives across requests in one dev server process.
  const g = globalThis as unknown as {
    __luvDemo?: { bills: Bill[]; luvs: Luv[]; signups: Set<string> };
  };
  if (!g.__luvDemo) {
    g.__luvDemo = { bills: structuredClone(DEMO_BILLS), luvs: [], signups: new Set() };
  }
  const db = g.__luvDemo;

  return {
    async listOpenBills() {
      return db.bills
        .filter((b) => b.status === "open")
        .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
    },
    async getBill(id) {
      return db.bills.find((b) => b.id === id) ?? null;
    },
    async createBill(input) {
      const bill: Bill = {
        id: `demo-${crypto.randomUUID().slice(0, 8)}`,
        created_at: new Date().toISOString(),
        ...input,
        remaining_cents: input.amount_cents,
        // In demo mode new bills skip verification so you can see them in the deck.
        verified: true,
        status: "open",
        luv_count: 0,
      };
      db.bills.unshift(bill);
      return bill;
    },
    async addLuv(input) {
      const bill = db.bills.find((b) => b.id === input.bill_id);
      if (!bill) throw new Error("Bill not found");
      if (bill.status !== "open") throw new Error("Bill is no longer open");
      const amount = Math.min(input.amount_cents, bill.remaining_cents);
      const luv: Luv = {
        id: `luv-${crypto.randomUUID().slice(0, 8)}`,
        created_at: new Date().toISOString(),
        bill_id: bill.id,
        giver_name: input.giver_name,
        amount_cents: amount,
        message: input.message,
        payment_status: "pledged",
      };
      db.luvs.push(luv);
      bill.remaining_cents -= amount;
      bill.luv_count += 1;
      if (bill.remaining_cents <= 0) bill.status = "funded";
      return { luv, bill };
    },
    async addNotifySignup(email) {
      db.signups.add(email);
    },
  };
}

// ---------- Supabase ----------

function supabaseStore(client: SupabaseClient): Store {
  return {
    async listOpenBills() {
      const { data, error } = await client
        .from("bills")
        .select("*")
        .eq("status", "open")
        .eq("verified", true)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Bill[];
    },
    async getBill(id) {
      const { data, error } = await client.from("bills").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data as Bill) ?? null;
    },
    async createBill(input) {
      const { data, error } = await client
        .from("bills")
        .insert({ ...input, remaining_cents: input.amount_cents })
        .select()
        .single();
      if (error) throw error;
      return data as Bill;
    },
    async addLuv(input) {
      // Atomic: the SQL function decrements remaining_cents and flips status.
      const { data, error } = await client.rpc("add_luv", {
        p_bill_id: input.bill_id,
        p_giver_name: input.giver_name,
        p_amount_cents: input.amount_cents,
        p_message: input.message,
      });
      if (error) throw error;
      return data as { luv: Luv; bill: Bill };
    },
    async addNotifySignup(email) {
      const { error } = await client
        .from("notify_signups")
        .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
      if (error) throw error;
    },
  };
}

// ---------- Factory ----------

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    cached = supabaseStore(createClient(url, key, { auth: { persistSession: false } }));
  } else {
    cached = demoStore();
  }
  return cached;
}

export function isDemoMode(): boolean {
  return !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
