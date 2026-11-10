"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import BillCard from "./BillCard";
import LuvSheet from "./LuvSheet";
import Celebration from "./Celebration";
import EmptyDeck from "./EmptyDeck";
import { celebrationLine } from "@/lib/celebrate";
import { recordMyLuv } from "@/lib/myLuvs";
import { type Bill, type Payout } from "@/lib/types";

const SWIPE_THRESHOLD = 110; // px
const FLICK_VELOCITY = 600; // px/s
const CELEBRATE_MS = 1800;
const FILTER_KEY = "stl.payoutFilter.v1";

type PayoutFilter = "all" | Payout;

export default function SwipeDeck({ initialBills }: { initialBills: Bill[] }) {
  const [filter, setFilter] = useState<PayoutFilter>("all");
  const [bills, setBills] = useState<Bill[]>(initialBills);

  // Restore the giver's filter choice, then apply it.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTER_KEY) as PayoutFilter | null;
      if (saved === "biller" || saved === "bank" || saved === "all") applyFilter(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = (f: PayoutFilter) => {
    setFilter(f);
    setPassed([]);
    setBills(f === "all" ? initialBills : initialBills.filter((b) => b.payout === f));
    try { localStorage.setItem(FILTER_KEY, f); } catch {}
  };
  const [passed, setPassed] = useState<Bill[]>([]); // undo stack
  const [exitDir, setExitDir] = useState<1 | -1>(1);
  const [luvTarget, setLuvTarget] = useState<Bill | null>(null);
  const [celebrating, setCelebrating] = useState<{ line: string; amount: number } | null>(null);

  const top = bills[0];
  const next = bills[1];
  const busy = !!luvTarget || !!celebrating;

  const pass = useCallback(() => {
    if (busy || !top) return;
    setExitDir(-1);
    setPassed((p) => [top, ...p]);
    setBills((b) => b.slice(1));
  }, [busy, top]);

  const undo = useCallback(() => {
    if (busy || passed.length === 0) return;
    const [last, ...rest] = passed;
    setPassed(rest);
    setExitDir(-1); // re-enters from the left
    setBills((b) => [last, ...b]);
  }, [busy, passed]);

  const luv = useCallback(() => {
    if (busy || !top) return;
    setLuvTarget(top);
  }, [busy, top]);

  // Keyboard: ← pass, → luv, Z undo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") pass();
      if (e.key === "ArrowRight") luv();
      if (e.key.toLowerCase() === "z") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pass, luv, undo]);

  const onLuvDone = (updated: Bill, amountCents: number, message: string | null) => {
    setLuvTarget(null);
    const fullyFunded = updated.remaining_cents <= 0;
    recordMyLuv({
      id: `${updated.id}-${Date.now()}`,
      at: new Date().toISOString(),
      bill_id: updated.id,
      poster_name: updated.poster_name,
      biller: updated.biller,
      category: updated.category,
      amount_cents: amountCents,
      fully_funded: fullyFunded,
      message,
    });
    setCelebrating({ line: celebrationLine(updated, fullyFunded), amount: amountCents });
    setTimeout(() => {
      setCelebrating(null);
      setExitDir(1);
      setBills((b) => b.slice(1));
    }, CELEBRATE_MS);
  };

  const directCount = initialBills.filter((b) => b.payout === "biller").length;

  const filterBar = (
    <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Where the money goes">
      <FilterChip active={filter === "all"} onClick={() => applyFilter("all")}>All bills</FilterChip>
      <FilterChip active={filter === "biller"} onClick={() => applyFilter("biller")}>
        🏦 Paid to biller <span className="opacity-60">({directCount})</span>
      </FilterChip>
      <FilterChip active={filter === "bank"} onClick={() => applyFilter("bank")}>
        👤 Paid to poster <span className="opacity-60">({initialBills.length - directCount})</span>
      </FilterChip>
    </div>
  );

  if (!top) {
    return (
      <div className="flex flex-col gap-5">
        {filterBar}
        <EmptyDeck onRestart={() => applyFilter(filter)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {filterBar}
      <div className="relative h-[520px] no-touch-pan">
        {next && (
          <div className="absolute inset-0 scale-[0.96] translate-y-3 opacity-70 pointer-events-none">
            <BillCard bill={next} />
          </div>
        )}
        <AnimatePresence initial={false} custom={exitDir}>
          <TopCard key={top.id} bill={top} onPass={pass} onLuv={luv} exitDir={exitDir} locked={busy} />
        </AnimatePresence>
        <AnimatePresence>
          {celebrating && <Celebration line={celebrating.line} amountCents={celebrating.amount} />}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-5">
        <RoundButton
          label="Undo last pass"
          onClick={undo}
          disabled={passed.length === 0 || busy}
          small
          className="bg-white border-2 border-stone-200 text-stone-500 hover:border-amber-400 hover:text-amber-600 disabled:opacity-30"
        >
          ↩
        </RoundButton>
        <RoundButton label="Pass" onClick={pass} disabled={busy} className="bg-white border-2 border-stone-200 text-stone-500 hover:border-stone-400">
          ✕
        </RoundButton>
        <RoundButton label="Send luv" onClick={luv} disabled={busy} big className="bg-luv-600 text-white shadow-lg shadow-luv-200 hover:bg-luv-700">
          💗
        </RoundButton>
      </div>
      <p className="text-center text-xs text-stone-400">
        Swipe, or use ← → keys · <kbd className="font-sans">Z</kbd> to undo a pass
      </p>

      <AnimatePresence>
        {luvTarget && (
          <LuvSheet bill={luvTarget} onClose={() => setLuvTarget(null)} onDone={onLuvDone} />
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
  locked,
}: {
  bill: Bill;
  onPass: () => void;
  onLuv: () => void;
  exitDir: 1 | -1;
  locked: boolean;
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
      drag={locked ? false : "x"}
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      custom={exitDir}
      initial={{ x: exitDir * -400, opacity: 0, rotate: exitDir * -10 }}
      animate={{ x: 0, opacity: 1, rotate: 0, transition: { type: "spring", damping: 26, stiffness: 260 } }}
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

function FilterChip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold border-2 transition whitespace-nowrap ${
        active ? "border-luv-600 bg-luv-50 text-luv-700" : "border-stone-200 text-stone-600 hover:border-luv-300"
      }`}
    >
      {children}
    </button>
  );
}

function RoundButton({
  children,
  label,
  onClick,
  big,
  small,
  disabled,
  className,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  big?: boolean;
  small?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const size = big ? "w-20 h-20 text-3xl" : small ? "w-12 h-12 text-xl" : "w-16 h-16 text-2xl";
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full flex items-center justify-center active:scale-90 transition disabled:cursor-not-allowed ${size} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
