"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import BillCard from "./BillCard";
import LuvSheet from "./LuvSheet";
import { type Bill } from "@/lib/types";

const SWIPE_THRESHOLD = 110; // px
const FLICK_VELOCITY = 600; // px/s

export default function SwipeDeck({ initialBills }: { initialBills: Bill[] }) {
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [exitDir, setExitDir] = useState<1 | -1>(1);
  const [luvTarget, setLuvTarget] = useState<Bill | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const top = bills[0];
  const next = bills[1];

  const pass = useCallback(() => {
    setExitDir(-1);
    setBills((b) => b.slice(1));
  }, []);

  const luv = useCallback(() => {
    if (top) setLuvTarget(top);
  }, [top]);

  // Keyboard: ← pass, → luv
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (luvTarget) return;
      if (e.key === "ArrowLeft") pass();
      if (e.key === "ArrowRight") luv();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pass, luv, luvTarget]);

  const onLuvDone = (updated: Bill, amountCents: number) => {
    setLuvTarget(null);
    setExitDir(1);
    setBills((b) => b.slice(1));
    setToast(`You sent ${(amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} to ${updated.biller} for ${updated.poster_name} 💗`);
    setTimeout(() => setToast(null), 3500);
  };

  if (!top) {
    return (
      <div className="text-center py-20 flex flex-col gap-3">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold">You&apos;ve seen every bill.</h2>
        <p className="text-stone-600 text-sm">Check back soon, or share the app so more people post.</p>
        <button
          onClick={() => setBills(initialBills)}
          className="mt-4 self-center rounded-full border-2 border-luv-200 px-5 py-2 text-sm font-semibold hover:border-luv-400"
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="relative h-[520px] no-touch-pan">
        {next && (
          <div className="absolute inset-0 scale-[0.96] translate-y-3 opacity-70 pointer-events-none">
            <BillCard bill={next} />
          </div>
        )}
        <AnimatePresence initial={false} custom={exitDir}>
          <TopCard key={top.id} bill={top} onPass={pass} onLuv={luv} exitDir={exitDir} />
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-6">
        <RoundButton label="Pass" onClick={pass} className="bg-white border-2 border-stone-200 text-stone-500 hover:border-stone-400">
          ✕
        </RoundButton>
        <RoundButton label="Send luv" onClick={luv} big className="bg-luv-600 text-white shadow-lg shadow-luv-200 hover:bg-luv-700">
          💗
        </RoundButton>
      </div>
      <p className="text-center text-xs text-stone-400">Swipe or use ← → keys</p>

      <AnimatePresence>
        {luvTarget && (
          <LuvSheet bill={luvTarget} onClose={() => setLuvTarget(null)} onDone={onLuvDone} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full bg-ink text-white text-sm px-5 py-3 shadow-xl max-w-[90vw] text-center"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopCard({
  bill,
  onPass,
  onLuv,
  exitDir,
}: {
  bill: Bill;
  onPass: () => void;
  onLuv: () => void;
  exitDir: 1 | -1;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-14, 14]);
  const luvOpacity = useTransform(x, [40, 140], [0, 1]);
  const passOpacity = useTransform(x, [-40, -140], [0, 1]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > SWIPE_THRESHOLD || velocity.x > FLICK_VELOCITY) onLuv();
    else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -FLICK_VELOCITY) onPass();
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      custom={exitDir}
      variants={{
        exit: (dir: 1 | -1) => ({ x: dir * 600, opacity: 0, rotate: dir * 20, transition: { duration: 0.3 } }),
      }}
      exit="exit"
      whileTap={{ scale: 0.99 }}
    >
      <BillCard bill={bill} />
      <motion.div
        style={{ opacity: luvOpacity }}
        className="absolute top-6 left-6 rotate-[-12deg] rounded-xl border-4 border-emerald-500 text-emerald-600 font-extrabold text-2xl px-3 py-1 bg-white/80"
      >
        LUV 💗
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-6 right-6 rotate-[12deg] rounded-xl border-4 border-stone-400 text-stone-500 font-extrabold text-2xl px-3 py-1 bg-white/80"
      >
        PASS
      </motion.div>
    </motion.div>
  );
}

function RoundButton({
  children,
  label,
  onClick,
  big,
  className,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  big?: boolean;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`rounded-full flex items-center justify-center active:scale-90 transition ${
        big ? "w-20 h-20 text-3xl" : "w-16 h-16 text-2xl"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
