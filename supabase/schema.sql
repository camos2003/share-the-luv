-- Share the Luv — initial schema
-- Run this in the Supabase SQL editor. Safe to re-run (idempotent-ish).

create extension if not exists "pgcrypto";

-- ---------- bills ----------
create table if not exists public.bills (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  poster_id        uuid references auth.users(id),   -- null until auth is wired up
  poster_name      text not null,                    -- first name only
  city             text not null,
  state            text not null,
  biller           text not null,                    -- who gets paid, never the poster
  category         text not null check (category in ('utility','rent','medical','tuition','phone','car','other')),
  amount_cents     integer not null check (amount_cents > 0),
  remaining_cents  integer not null check (remaining_cents >= 0),
  due_date         date,
  story            text not null check (char_length(story) <= 400),
  verified         boolean not null default false,
  status           text not null default 'pending_verification'
                   check (status in ('pending_verification','open','funded','paid')),
  luv_count        integer not null default 0
);

create index if not exists bills_open_idx on public.bills (status, verified, due_date);

-- ---------- luvs (pledges / payments) ----------
create table if not exists public.luvs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  bill_id         uuid not null references public.bills(id) on delete cascade,
  giver_id        uuid references auth.users(id),
  giver_name      text,                               -- null = anonymous
  amount_cents    integer not null check (amount_cents > 0),
  message         text check (char_length(message) <= 200),
  payment_status  text not null default 'pledged'
                  check (payment_status in ('pledged','captured','sent_to_biller')),
  stripe_payment_intent text                          -- filled in once Stripe is wired
);

create index if not exists luvs_bill_idx on public.luvs (bill_id);

-- ---------- atomic "luv" ----------
-- Decrements remaining_cents, bumps luv_count, flips to 'funded' at zero.
create or replace function public.add_luv(
  p_bill_id uuid,
  p_giver_name text,
  p_amount_cents integer,
  p_message text
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_bill   public.bills%rowtype;
  v_luv    public.luvs%rowtype;
  v_amount integer;
begin
  select * into v_bill from public.bills where id = p_bill_id for update;
  if not found then raise exception 'Bill not found'; end if;
  if v_bill.status <> 'open' then raise exception 'Bill is no longer open'; end if;

  v_amount := least(p_amount_cents, v_bill.remaining_cents);

  insert into public.luvs (bill_id, giver_name, amount_cents, message)
  values (p_bill_id, p_giver_name, v_amount, p_message)
  returning * into v_luv;

  update public.bills
     set remaining_cents = remaining_cents - v_amount,
         luv_count       = luv_count + 1,
         status          = case when remaining_cents - v_amount <= 0 then 'funded' else status end
   where id = p_bill_id
   returning * into v_bill;

  return jsonb_build_object('luv', to_jsonb(v_luv), 'bill', to_jsonb(v_bill));
end;
$$;

-- ---------- RLS ----------
-- The app currently talks to Supabase with the service role key from server
-- routes only, so RLS is on but permissive-for-service-role by default.
-- Tighten these once auth is added.
alter table public.bills enable row level security;
alter table public.luvs  enable row level security;

drop policy if exists "public can read open verified bills" on public.bills;
create policy "public can read open verified bills"
  on public.bills for select
  using (status = 'open' and verified = true);
