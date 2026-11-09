"use client";

import { useState } from "react";
import Link from "next/link";

export default function EmptyDeck({ onRestart }: { onRestart: () => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [shared, setShared] = useState(false);

  const notify = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setState(res.ok ? "done" : "error");
  };

  const share = async () => {
    const url = window.location.origin;
    const data = { title: "Share the Luv", text: "Swipe right to pay a stranger's bill 💗", url };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      /* user cancelled share sheet */
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="text-center flex flex-col gap-2">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-extrabold tracking-tight">You&apos;ve seen every bill.</h2>
        <p className="text-stone-600 text-sm">
          New ones land every day. Want a nudge when they do?
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-luv-100 p-5 flex flex-col gap-3">
        {state === "done" ? (
          <p className="text-center text-sm font-semibold text-emerald-700">
            You&apos;re on the list. We&apos;ll only email when there are new bills. 💗
          </p>
        ) : (
          <form onSubmit={notify} className="flex flex-col gap-2">
            <label htmlFor="notify-email" className="text-sm font-semibold">
              Get notified when new bills land
            </label>
            <div className="flex gap-2">
              <input
                id="notify-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-luv-400"
              />
              <button
                disabled={state === "busy"}
                className="rounded-xl bg-luv-600 text-white px-4 font-semibold disabled:opacity-50 hover:bg-luv-700"
              >
                {state === "busy" ? "…" : "Notify me"}
              </button>
            </div>
            {state === "error" && <p className="text-xs text-luv-600">That didn&apos;t go through — try again?</p>}
            <p className="text-xs text-stone-400">No spam. Unsubscribe in one tap.</p>
          </form>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/post"
          className="rounded-2xl border-2 border-luv-200 p-4 text-center hover:border-luv-400 transition"
        >
          <div className="text-2xl">🧾</div>
          <div className="font-semibold text-sm mt-1">Post a bill</div>
          <div className="text-xs text-stone-500">Yours or someone you know</div>
        </Link>
        <button
          onClick={share}
          className="rounded-2xl border-2 border-luv-200 p-4 text-center hover:border-luv-400 transition"
        >
          <div className="text-2xl">📣</div>
          <div className="font-semibold text-sm mt-1">{shared ? "Link copied!" : "Share the app"}</div>
          <div className="text-xs text-stone-500">More swipers, more bills paid</div>
        </button>
      </div>

      <div className="flex justify-center gap-4 text-sm">
        <Link href="/me" className="text-luv-600 font-semibold hover:underline">See my luvs</Link>
        <button onClick={onRestart} className="text-stone-500 hover:underline">Swipe through again</button>
      </div>
    </div>
  );
}
