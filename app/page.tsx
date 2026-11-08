import Link from "next/link";
import { getStore } from "@/lib/store";
import { formatMoney } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const bills = await getStore().listOpenBills();
  const totalOpen = bills.reduce((s, b) => s + b.remaining_cents, 0);

  return (
    <div className="flex flex-col gap-8 pt-6">
      <section className="text-center flex flex-col gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
          Swipe right.<br />
          <span className="text-luv-600">Pay someone&apos;s light bill.</span>
        </h1>
        <p className="text-stone-600">
          Real bills, verified. Your money goes straight to the utility, the hospital, the
          school — never to a person. Pay all of it or chip in a little.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/swipe"
            className="rounded-full bg-luv-600 text-white px-6 py-3 font-semibold shadow-lg shadow-luv-200 hover:bg-luv-700 active:scale-95 transition"
          >
            Start swiping
          </Link>
          <Link
            href="/post"
            className="rounded-full border-2 border-luv-200 px-6 py-3 font-semibold hover:border-luv-400 active:scale-95 transition"
          >
            I need a hand
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Bills waiting" value={String(bills.length)} />
        <Stat label="Total open" value={formatMoney(totalOpen)} />
      </section>

      <section className="rounded-2xl bg-white border border-luv-100 p-5 flex flex-col gap-3 text-sm">
        <h2 className="font-bold text-base">How it works</h2>
        <Step n={1} text="Someone posts a bill — the biller, the amount, a few sentences." />
        <Step n={2} text="We verify it's a real bill with a real balance." />
        <Step n={3} text="You swipe. Right to luv it, left to pass." />
        <Step n={4} text="We pay the biller directly. They get a receipt, you get the warm fuzzies." />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white border border-luv-100 p-4">
      <div className="text-2xl font-extrabold text-luv-600">{value}</div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="shrink-0 w-6 h-6 rounded-full bg-luv-100 text-luv-700 font-bold text-xs flex items-center justify-center">
        {n}
      </span>
      <span className="text-stone-700">{text}</span>
    </div>
  );
}
