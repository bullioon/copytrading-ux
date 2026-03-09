"use client";

import React, { useMemo } from "react";

type PayoutWindowBarProps = {
  cycleDays?: number;
  day?: number;
  payoutWindowDays?: number;
  feeLabel?: string;
  windowLabel?: string;
  rulesLabel?: string;
  accent?: "purple" | "green";
  glow?: string;
  className?: string;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function PayoutWindowBar({
  cycleDays = 21,
  day = 0,
  payoutWindowDays = 3,
  feeLabel = "PAY ONCE $150",
  windowLabel = "21D PAYOUT WINDOWS",
  rulesLabel = "STRICT RISK LIMITS",
  accent = "purple",
  glow,
  className = "",
}: PayoutWindowBarProps) {
  const safeCycle = Math.max(7, cycleDays);
  const safePayout = clamp(payoutWindowDays, 1, Math.floor(safeCycle / 2));
  const currentDay = clamp(day, 0, safeCycle);
  const progress = safeCycle === 0 ? 0 : currentDay / safeCycle;

  const payoutStart = safeCycle - safePayout;
  const payoutEnd = safeCycle;

  const segments = useMemo(() => {
    const maxSeg = 28;
    const segCount = clamp(safeCycle, 12, maxSeg);
    const daysPerSeg = safeCycle / segCount;

    return Array.from({ length: segCount }).map((_, i) => {
      const segDayStart = i * daysPerSeg;
      const segDayEnd = (i + 1) * daysPerSeg;

      const isPayout = segDayEnd > payoutStart && segDayStart < payoutEnd;
      const isDone = segDayEnd <= currentDay;

      return { isPayout, isDone };
    });
  }, [safeCycle, payoutStart, payoutEnd, currentDay]);

  const accentRing =
    accent === "purple" ? "ring-violet-400/30" : "ring-emerald-400/30";

  const accentText =
    accent === "purple" ? "text-violet-200" : "text-emerald-200";

  const accentChip =
    accent === "purple"
      ? "border-violet-400/30 bg-violet-500/10 text-violet-200"
      : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";

  const payoutBg =
    accent === "purple" ? "bg-violet-500/12" : "bg-emerald-500/12";

  const payoutBorder =
    accent === "purple"
      ? "border-violet-400/35"
      : "border-emerald-400/35";

  const glowShadow =
    glow ??
    (accent === "purple"
      ? "0 0 70px rgba(168,85,247,0.18)"
      : "0 0 70px rgba(16,185,129,0.14)");

  return (
    <section
      className={[
        "relative rounded-[22px] border border-white/10 bg-black/40",
        "p-4 md:p-5 overflow-hidden ring-1",
        accentRing,
        className,
      ].join(" ")}
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04), ${glowShadow}` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.25]">
        <div className="absolute -left-20 top-0 h-full w-[240px] rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3.6s_linear_infinite]" />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.22em] text-white/45">
            PAYOUT CYCLE
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className={["text-[13px] font-semibold", accentText].join(" ")}>
              {windowLabel}
            </div>
            <div className="text-[12px] text-white/45">
              Day{" "}
              <span className="text-white/80 font-medium">
                {Math.round(currentDay)}
              </span>{" "}
              / {safeCycle}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              "inline-flex items-center rounded-full border px-3 py-1",
              "text-[11px] tracking-[0.18em] uppercase",
              accentChip,
            ].join(" ")}
          >
            {feeLabel}
          </span>

          <span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] tracking-[0.18em] uppercase text-white/70">
            {rulesLabel}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-white/45">
          <span>Cycle progress</span>
          <span className="text-white/60">{Math.round(progress * 100)}%</span>
        </div>

        <div className="mt-2 relative">
          <div className="relative rounded-[16px] border border-white/10 bg-black/55 p-2">
            <div className="absolute inset-y-2 right-2 rounded-[12px] overflow-hidden">
              <div
                className={[
                  "h-full border-l",
                  payoutBorder,
                  payoutBg,
                  "relative",
                ].join(" ")}
                style={{
                  width: `${(safePayout / safeCycle) * 100}%`,
                }}
              >
                <div className="absolute inset-0 opacity-[0.38] bg-[linear-gradient(135deg,transparent_0%,transparent_40%,rgba(255,255,255,0.18)_50%,transparent_60%,transparent_100%)] bg-[length:14px_14px] animate-[hatch_2.2s_linear_infinite]" />
              </div>
            </div>

            <div className="relative flex gap-1.5">
              {segments.map((s, idx) => {
                const base =
                  "h-[18px] md:h-[20px] flex-1 rounded-[10px] border transition-all";
                const done =
                  s.isDone
                    ? accent === "purple"
                      ? "bg-violet-400/25 border-violet-300/25"
                      : "bg-emerald-400/20 border-emerald-300/25"
                    : "bg-white/6 border-white/10";
                const payout =
                  s.isPayout
                    ? accent === "purple"
                      ? "ring-1 ring-violet-300/20"
                      : "ring-1 ring-emerald-300/20"
                    : "";

                return (
                  <div
                    key={idx}
                    className={[base, done, payout].join(" ")}
                    title={
                      s.isPayout
                        ? "Payout window"
                        : s.isDone
                        ? "Completed"
                        : "Pending"
                    }
                  />
                );
              })}
            </div>

            <div
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                left: `calc(${progress * 100}% - 10px)`,
              }}
            >
              <div
                className={[
                  "h-5 w-5 rounded-full border border-white/20 bg-black/70",
                  accent === "purple"
                    ? "shadow-[0_0_18px_rgba(168,85,247,0.35)]"
                    : "shadow-[0_0_18px_rgba(16,185,129,0.28)]",
                ].join(" ")}
              >
                <div
                  className={[
                    "absolute inset-0 rounded-full",
                    accent === "purple"
                      ? "bg-violet-400/25"
                      : "bg-emerald-400/20",
                    "animate-[pulseDot_1.6s_ease-in-out_infinite]",
                  ].join(" ")}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-white/45">
            <span>START</span>
            <span className="text-white/70">
              PAYOUT WINDOW{" "}
              <span className={accentText}>
                {safeCycle - safePayout + 1}–{safeCycle}
              </span>
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-240px) rotate(12deg);
          }
          100% {
            transform: translateX(1100px) rotate(12deg);
          }
        }
        @keyframes hatch {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 28px 28px;
          }
        }
        @keyframes pulseDot {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.12);
            opacity: 0.9;
          }
        }
      `}</style>
    </section>
  );
}