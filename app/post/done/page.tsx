import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore, isDemoMode } from "@/lib/store";
import { CATEGORY_EMOJI, formatMoney } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PostDonePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();
  const bill = await getStore().getBill(id);
  if (!bill) notFound();
  const demo = isDemoMode();
  const live = bill.status === "open" && bill.verified;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="text-center flex flex-col gap-2">
        <div className="text-5xl">{live ? "💗" : "✅"}</div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {live ? "Your bill is live." : "Your bill is posted."}
        </h1>
        <p className="text-sm text-stone-600">
          Thanks, {bill.poster_name}. Here&apos;s what happens next.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-luv-100 p-4 flex items-center gap-3">
        <div className="text-3xl">{CATEGORY_EMOJI[bill.category]}</div>
        <div className="flex-1">
          <div className="font-bold">{formatMoney(bill.amount_cents)} to {bill.biller}</div>
          <div className="text-xs text-stone-500">
            {bill.city}, {bill.state}
            {bill.due_date && <> · due {new Date(bill.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>}
          </div>
        </div>
      </div>

      <ol className="rounded-2xl bg-white border border-luv-100 p-5 flex flex-col gap-4 text-sm">
        <Step n={1} done title="Posted" text="Your bill is in our queue." />
        <Step
          n={2}
          done={live}
          title="Verification"
          text={
            demo
              ? "In demo mode this is instant. In the real app we confirm the balance with the biller first — usually within 24 hours."
              : "We confirm the balance with the biller before anything goes live — usually within 24 hours. We'll email you either way."
          }
        />
        <Step n={3} done={false} title="People swipe" text="Swipers see your first name, city, biller, amount and story — nothing else." />
        <Step n={4} done={false} title="We pay the biller" text="Luvs go straight to the biller. You get a receipt when the balance moves. Money never passes through you." />
      </ol>

      <div className="flex gap-3 justify-center">
        <Link href="/swipe" className="rounded-full bg-luv-600 text-white px-5 py-3 text-sm font-semibold hover:bg-luv-700">
          {live ? "See it in the deck" : "Swipe while you wait"}
        </Link>
        <Link href="/" className="rounded-full border-2 border-luv-200 px-5 py-3 text-sm font-semibold hover:border-luv-400">
          Home
        </Link>
      </div>
    </div>
  );
}

function Step({ n, done, title, text }: { n: number; done: boolean; title: string; text: string }) {
  return (
    <li className="flex gap-3 items-start">
      <span
        className={`shrink-0 w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center ${
          done ? "bg-emerald-500 text-white" : "bg-luv-100 text-luv-700"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-stone-600">{text}</div>
      </div>
    </li>
  );
}
