import { CATEGORY_EMOJI, CATEGORY_LABELS, formatMoney, type Bill } from "@/lib/types";

function daysUntil(date: string | null): string | null {
  if (!date) return null;
  const diff = Math.ceil((new Date(date + "T00:00:00").getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return "Past due";
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
}

function PayoutBadge({ bill }: { bill: Bill }) {
  const direct = bill.payout === "biller";
  return (
    <div
      className={`mt-1 self-start inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        direct ? "bg-white text-emerald-700" : "bg-white/25 text-white"
      }`}
    >
      <span aria-hidden>{direct ? "🏦" : "👤"}</span>
      {direct ? `Paid straight to ${bill.biller}` : `Paid to ${bill.poster_name}'s bank`}
    </div>
  );
}

export default function BillCard({ bill }: { bill: Bill }) {
  const pct = Math.round(((bill.amount_cents - bill.remaining_cents) / bill.amount_cents) * 100);
  const due = daysUntil(bill.due_date);
  const urgent = bill.due_date
    ? new Date(bill.due_date + "T00:00:00").getTime() - Date.now() < 4 * 86_400_000
    : false;

  return (
    <article className="h-full w-full rounded-3xl bg-white shadow-xl border border-luv-100 overflow-hidden flex flex-col select-none">
      <div className="bg-gradient-to-br from-luv-500 to-luv-700 text-white p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium opacity-90">
          <span className="rounded-full bg-white/20 px-2 py-0.5">
            {CATEGORY_EMOJI[bill.category]} {CATEGORY_LABELS[bill.category]}
          </span>
          {bill.verified && <span>✓ Verified</span>}
        </div>
        <div className="text-4xl font-extrabold tracking-tight">{formatMoney(bill.remaining_cents)}</div>
        <div className="text-sm opacity-90">
          {bill.remaining_cents < bill.amount_cents && <>of {formatMoney(bill.amount_cents)} · </>}
          {bill.biller}
        </div>
        <PayoutBadge bill={bill} />
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-baseline justify-between">
          <div className="font-bold text-lg">
            {bill.poster_name}
            <span className="text-stone-400 font-normal text-sm"> · {bill.city}, {bill.state}</span>
          </div>
          {due && (
            <span className={`text-xs font-semibold ${urgent ? "text-luv-600" : "text-stone-500"}`}>
              {due}
            </span>
          )}
        </div>

        <p className="text-stone-700 leading-relaxed">{bill.story}</p>

        <div className="mt-auto flex flex-col gap-1">
          <div className="h-2 rounded-full bg-luv-100 overflow-hidden">
            <div className="h-full bg-luv-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-stone-500 flex justify-between">
            <span>{pct}% covered</span>
            <span>
              {bill.luv_count} {bill.luv_count === 1 ? "person" : "people"} sent luv
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
