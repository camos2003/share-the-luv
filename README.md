# Share the Luv 💗

Swipe right to pay a stranger's bill. Money goes to the **biller** (the utility, the hospital, the school) — never to the person. Pay all of it or chip in a little.

Born from a Facebook joke about a Tinder for bored billionaires paying your bills.

## Run it (Windows)

Prereq: [Node.js 20+](https://nodejs.org) (LTS). Then in PowerShell:

```powershell
cd $HOME\Desktop\ShareTheLuv
npm install
npm run dev
```

Open http://localhost:3000. With no `.env.local` it runs in **demo mode**: six fake bills, in-memory, nothing is really paid, resets when you restart the server.

## Go live with Supabase

1. Create a free project at https://supabase.com.
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → service_role (server-only; never ship to the browser)
4. Restart `npm run dev`. The demo banner disappears.

New bills land as `pending_verification` / `verified = false` and won't show in the deck until you flip them to `open` + `verified = true` in the Supabase table editor. That's your manual verification step for now.

## Project layout

```
app/
  page.tsx                 landing
  swipe/page.tsx           the deck
  post/page.tsx            post-a-bill form
  api/bills/route.ts       GET open bills, POST new bill
  api/bills/[id]/luv/      POST a luv (pledge) against a bill
components/
  SwipeDeck.tsx            drag/swipe, keyboard, toast
  BillCard.tsx             the card
  LuvSheet.tsx             amount picker bottom sheet
  PostBillForm.tsx
lib/
  types.ts                 Bill, Luv, categories, formatMoney
  store.ts                 data layer — demo (in-memory) or Supabase
  demo.ts                  seed bills
supabase/schema.sql        tables, atomic add_luv() function, RLS
```

Everything touches data through `lib/store.ts`, so swapping or extending the backend is a one-file change.

## Roadmap (rough order)

1. **Auth** — Supabase Auth (magic link). Posters own their bills; givers get a history.
2. **Bill upload + verification** — image/PDF upload to Supabase Storage, admin page to approve. Later: OCR the account number and amount.
3. **Stripe** — PaymentIntent on "Send luv", record the `luv` on webhook success, hold funds in a platform balance.
4. **Pay the biller** — this is the hard part and the moat. Options: a bill-pay API (Method, Spinwheel, Plaid Transfer), prepaid utility cards, or manual payment at first with the receipt uploaded. Start manual.
5. **Share cards** — "I just paid Dre's light bill 💗" OG image for socials. This is the growth loop.
6. **Trust & safety** — rate limits, duplicate detection, one open bill per person, flagging.
7. **Nonprofit question** — talk to a lawyer about whether to run this as a 501(c)(3) (tax-deductible luvs, fewer money-transmitter headaches) or a for-profit with a fiscal sponsor.

## Payout choice

Posters choose where luvs go: **biller** (we pay the company — default, badged, filterable) or **bank** (their own account). Givers can filter the deck to direct-to-biller only. Bank payout is the higher-risk path: it needs KYC on the poster and a money-transmitter conversation with a lawyer before real money moves.

## Why it's not a "sugar" app

The money never touches the poster. That single design choice keeps it out of adult-adjacent payment-processor categories, out of FOSTA-SESTA exposure, and in the app stores.
