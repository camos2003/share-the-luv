"use client";

import { motion } from "framer-motion";
import { formatMoney } from "@/lib/types";

const COLORS = ["#f43f5e", "#fb7185", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"];

// Deterministic "random" so server/client markup never disagree.
const PIECES = Array.from({ length: 36 }, (_, i) => {
  const t = (i * 137.508) % 360; // golden angle spread
  return {
    left: (i * 61) % 100,
    delay: ((i * 37) % 10) / 20,
    rot: t,
    color: COLORS[i % COLORS.length],
    w: 6 + (i % 3) * 3,
    h: 10 + (i % 4) * 3,
    drift: ((i % 7) - 3) * 18,
  };
});

export default function Celebration({ line, amountCents }: { line: string; amountCents: number }) {
  return (
    <motion.div
      className="absolute inset-0 z-10 rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-luv-500 to-luv-700 text-white"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      role="status"
      aria-live="polite"
    >
      {PIECES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 rounded-sm"
          style={{ left: `${p.left}%`, width: p.w, height: p.h, background: p.color }}
          initial={{ y: -20, opacity: 0, rotate: p.rot }}
          animate={{ y: 560, x: p.drift, opacity: [0, 1, 1, 0], rotate: p.rot + 540 }}
          transition={{ duration: 1.6, delay: p.delay, ease: "easeIn" }}
        />
      ))}

      <div className="relative text-center px-8 flex flex-col gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.5, times: [0, 0.6, 1] }}
          className="text-7xl"
        >
          💗
        </motion.div>
        <motion.h2
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-2xl font-extrabold leading-tight"
        >
          {line}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-white/90 text-sm"
        >
          {formatMoney(amountCents)} sent. Saved to <span className="font-semibold">My luvs</span>.
        </motion.p>
      </div>
    </motion.div>
  );
}
