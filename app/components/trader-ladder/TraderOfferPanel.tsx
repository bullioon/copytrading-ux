"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TraderOfferPanelProps = {
  glow?: string;
  feeUsd?: number;
  onStart?: () => void;
};

type FeedItemType = {
  id: string;
  text: string;
  time: string;
};

type FaqItem = {
  q: string;
  a: string;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.28em] text-white/38">
      {children}
    </div>
  );
}

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "violet" | "good" | "bad";
}) {
  const cls =
    tone === "violet"
      ? "border-purple-300/20 bg-purple-500/[0.10] text-purple-100"
      : tone === "good"
        ? "border-emerald-300/18 bg-emerald-500/[0.07] text-emerald-100"
        : tone === "bad"
          ? "border-red-300/18 bg-red-500/[0.08] text-red-100"
          : "border-white/10 bg-white/[0.04] text-white/72";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] tracking-[0.16em]",
        cls
      )}
    >
      {children}
    </span>
  );
}

function SectionDivider() {
  return (
    <div className="relative my-9 h-10">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/8" />
      <div className="absolute left-1/2 top-1/2 h-16 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.14),rgba(139,92,246,0.10),transparent_70%)] blur-2xl" />
    </div>
  );
}

function OrbitalDots() {
  return (
    <>
      <div className="pointer-events-none absolute left-[10%] top-[18%] h-1.5 w-1.5 rounded-full bg-purple-300/80 shadow-[0_0_12px_rgba(196,181,253,0.65)] animate-pulse" />
      <div className="pointer-events-none absolute left-[82%] top-[25%] h-1.5 w-1.5 rounded-full bg-blue-300/80 shadow-[0_0_12px_rgba(147,197,253,0.65)] animate-pulse" />
      <div className="pointer-events-none absolute left-[22%] top-[72%] h-1 w-1 rounded-full bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.55)] animate-pulse" />
      <div className="pointer-events-none absolute left-[76%] top-[78%] h-1.5 w-1.5 rounded-full bg-purple-200/70 shadow-[0_0_12px_rgba(233,213,255,0.55)] animate-pulse" />
      <div className="pointer-events-none absolute left-[48%] top-[9%] h-1 w-1 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.55)] animate-pulse" />
    </>
  );
}

function NeutronCore({ size = 58 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full border border-white/10 bg-black/55" />
      <div className="absolute inset-[18%] rounded-full border border-white/10 opacity-60" />
      <div className="absolute inset-[36%] rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.35)]" />

      <div className="absolute inset-0 neutron-orbit-a">
        <div className="absolute left-1/2 top-[3px] h-2 w-2 -translate-x-1/2 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,0.65)]" />
      </div>

      <div className="absolute inset-0 neutron-orbit-b">
        <div className="absolute left-1/2 bottom-[3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-blue-300 shadow-[0_0_14px_rgba(147,197,253,0.55)]" />
      </div>

      <div className="absolute inset-0 neutron-orbit-c">
        <div className="absolute right-[4px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.45)]" />
      </div>
    </div>
  );
}

function HoverPanel({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[26px] border bg-black/45 p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01]",
        highlight ? "border-purple-300/18" : "border-white/10"
      )}
      style={{
        boxShadow: highlight
          ? "0 0 0 1px rgba(255,255,255,0.04), 0 0 60px rgba(96,165,250,0.08)"
          : "0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.08),rgba(139,92,246,0.06),transparent_70%)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function ProgressPath({ active = 1 }: { active?: 1 | 2 | 3 }) {
  const items = [
    { label: "LEVEL 1", sub: "ENTRY" },
    { label: "LEVEL 2", sub: "UNLOCK" },
    { label: "LEVEL 3", sub: "SCALE" },
  ];

  return (
    <div className="rounded-[24px] border border-white/10 bg-black/40 p-5">
      <div className="flex items-center justify-between gap-3">
        {items.map((item, idx) => {
          const n = (idx + 1) as 1 | 2 | 3;
          const isActive = n === active;
          const isPast = n < active;

          return (
            <React.Fragment key={item.label}>
              <div className="flex min-w-[90px] flex-col items-center text-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border text-[12px] font-semibold transition",
                    isActive
                      ? "border-purple-300/25 bg-purple-500/[0.10] text-white"
                      : isPast
                        ? "border-emerald-300/20 bg-emerald-500/[0.08] text-emerald-100"
                        : "border-white/10 bg-white/[0.03] text-white/65"
                  )}
                >
                  {n}
                </div>
                <div className="mt-2 text-[10px] tracking-[0.18em] text-white/44">
                  {item.label}
                </div>
                <div className="mt-1 text-[11px] text-white/68">{item.sub}</div>
              </div>

              {idx < items.length - 1 ? (
                <div className="relative hidden h-px flex-1 md:block">
                  <div className="absolute inset-0 bg-white/10" />
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 bg-[linear-gradient(90deg,rgba(96,165,250,0.8),rgba(196,181,253,0.85))]",
                      idx + 1 < active ? "w-full" : idx + 1 === active ? "w-1/2" : "w-0"
                    )}
                  />
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <HoverPanel>
      <div className="flex items-center gap-3">
        <NeutronCore size={38} />
        <div className="text-[17px] font-semibold text-white">{title}</div>
      </div>
      <div className="mt-4 text-[14px] leading-relaxed text-white/58">{desc}</div>
    </HoverPanel>
  );
}

function MiniMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "violet" | "good" | "bad";
}) {
  const valueCls =
    tone === "violet"
      ? "text-purple-200"
      : tone === "good"
        ? "text-emerald-300"
        : tone === "bad"
          ? "text-red-300"
          : "text-white";

  return (
    <HoverPanel>
      <div className="text-[10px] tracking-[0.18em] text-white/40">{label}</div>
      <div className={cn("mt-2 text-[24px] font-semibold", valueCls)}>{value}</div>
    </HoverPanel>
  );
}

function StepCard({
  step,
  title,
  desc,
}: {
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <HoverPanel>
      <div className="text-[11px] tracking-[0.22em] text-purple-200">STEP {step}</div>
      <div className="mt-2 text-[18px] font-semibold text-white">{title}</div>
      <div className="mt-3 text-[14px] leading-relaxed text-white/56">{desc}</div>
    </HoverPanel>
  );
}

function LevelCard({
  level,
  capital,
  subtitle,
  entry,
  target,
  split,
  bullets,
  cta,
  onClick,
  highlight = false,
}: {
  level: string;
  capital: string;
  subtitle: string;
  entry: string;
  target: string;
  split: string;
  bullets: string[];
  cta: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <HoverPanel highlight={highlight}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <NeutronCore size={40} />
          <div>
            <div className="text-[18px] font-semibold text-white">{level}</div>
            <div className="mt-1 text-[11px] tracking-[0.18em] text-white/48">
              {subtitle}
            </div>
          </div>
        </div>

        <Chip tone={highlight ? "violet" : "default"}>{entry}</Chip>
      </div>

      <div className="mt-6 text-[46px] leading-none font-semibold tracking-tight text-white">
        {capital}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip tone="violet">TARGET {target}</Chip>
        <Chip tone="bad">MAX LOSS 10%</Chip>
        <Chip>SPLIT {split}</Chip>
      </div>

      <div className="mt-5 space-y-2">
        {bullets.map((b) => (
          <div key={b} className="flex gap-2 text-[13px] text-white/62">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/30" />
            <span>{b}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onClick}
        className={cn(
          "mt-6 w-full rounded-[18px] border px-5 py-4 text-[13px] font-semibold tracking-[0.14em] uppercase transition",
          highlight
            ? "border-purple-300/20 bg-purple-500/[0.10] text-white hover:bg-purple-500/[0.16]"
            : "border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]"
        )}
      >
        {cta}
      </button>
    </HoverPanel>
  );
}

function SocialProofCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <HoverPanel>
      <div className="text-[10px] tracking-[0.18em] text-white/40">{title}</div>
      <div className="mt-2 text-[30px] font-semibold text-white">{value}</div>
      <div className="mt-2 text-[13px] text-white/55">{sub}</div>
    </HoverPanel>
  );
}

function LiveFundsCounter({
  start = 3903097,
}: {
  start?: number;
}) {
  const [value, setValue] = useState(start);

  useEffect(() => {
    const t = setInterval(() => {
      setValue((prev) => {
        const delta = Math.floor(Math.random() * 3200) + 400;
        const direction = Math.random() > 0.72 ? 1 : -1;
        const next = prev + delta * direction;
        return Math.max(3500000, Math.min(4300000, next));
      });
    }, 1800);

    return () => clearInterval(t);
  }, []);

  return (
    <span>
      {value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })}
    </span>
  );
}

function LiveFeed() {
  const feedBank: FeedItemType[] = useMemo(
    () => [
      {
        id: "1",
        text: "Trader Sigma passed Level 1 and unlocked the next capital tier.",
        time: "2m ago",
      },
      {
        id: "2",
        text: "Trader Atlas entered the payout window after compliant performance.",
        time: "9m ago",
      },
      {
        id: "3",
        text: "Trader Orion joined the dashboard copy environment after progression.",
        time: "18m ago",
      },
      {
        id: "4",
        text: "Trader Nova completed minimum trading days and stayed inside rules.",
        time: "24m ago",
      },
      {
        id: "5",
        text: "Trader Helix reached target progression and moved toward Level 2.",
        time: "37m ago",
      },
    ],
    []
  );

  const [items, setItems] = useState<FeedItemType[]>(feedBank.slice(0, 3));
  const [cursor, setCursor] = useState(3);

  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) => {
        const nextItem = feedBank[cursor % feedBank.length];
        return [nextItem, ...prev].slice(0, 3);
      });
      setCursor((c) => c + 1);
    }, 5000);

    return () => clearInterval(t);
  }, [cursor, feedBank]);

  return (
    <HoverPanel>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Eyebrow>LIVE FEED</Eyebrow>
          <div className="mt-1 text-[20px] font-semibold text-white">
            Community pulse
          </div>
        </div>
        <Chip tone="violet">LIVE</Chip>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.id}-${item.time}`}
            className="animate-[feedIn_.45s_ease] flex items-start justify-between gap-3 rounded-[18px] border border-white/10 bg-black/30 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="relative mt-1 h-3 w-3 rounded-full bg-violet-300/80 shadow-[0_0_14px_rgba(196,181,253,0.55)]">
                <div className="absolute inset-0 rounded-full animate-ping bg-violet-300/30" />
              </div>
              <div className="text-[13px] text-white/72">{item.text}</div>
            </div>
            <div className="shrink-0 text-[11px] text-white/36">{item.time}</div>
          </div>
        ))}
      </div>
    </HoverPanel>
  );
}

function TraderCard({
  name,
  roi,
  desc,
  onCopy,
}: {
  name: string;
  roi: string;
  desc: string;
  onCopy: () => void;
}) {
  return (
    <HoverPanel>
      <div className="flex items-center gap-3">
        <NeutronCore size={42} />
        <div>
          <div className="text-[16px] font-semibold text-white">{name}</div>
          <div className="mt-1 text-[12px] text-white/48">Active operator</div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-white/40">PERFORMANCE</div>
          <div className="mt-1 text-[24px] font-semibold text-purple-200">{roi}</div>
        </div>
        <Chip tone="violet">COPY READY</Chip>
      </div>

      <div className="mt-4 text-[13px] leading-relaxed text-white/58">{desc}</div>

      <button
        onClick={onCopy}
        className="mt-5 w-full rounded-[18px] border border-white/12 bg-white/[0.04] px-4 py-3 text-[12px] font-semibold tracking-[0.14em] text-white/88 transition hover:bg-white/[0.07]"
      >
        COPY THIS TRADER →
      </button>
    </HoverPanel>
  );
}

function CompareRow({
  left,
  right,
}: {
  left: string;
  right: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 border-t border-white/10 px-4 py-3 text-[13px]">
      <div className="text-white/45">{left}</div>
      <div className="text-white/85">{right}</div>
    </div>
  );
}

function UpsideCard({
  level,
  capital,
  move,
  gross,
  split,
  payout,
}: {
  level: string;
  capital: string;
  move: string;
  gross: string;
  split: string;
  payout: string;
}) {
  return (
    <HoverPanel>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-white/40">{level}</div>
          <div className="mt-1 text-[22px] font-semibold text-white">{capital}</div>
        </div>
        <Chip tone="violet">{move}</Chip>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniMetric label="GROSS" value={gross} />
        <MiniMetric label="SPLIT" value={split} tone="violet" />
      </div>

      <div className="mt-4 rounded-[18px] border border-purple-300/15 bg-purple-500/[0.06] px-4 py-4">
        <div className="text-[10px] tracking-[0.18em] text-white/42">ESTIMATED TRADER PAYOUT</div>
        <div className="mt-2 text-[28px] font-semibold text-white">{payout}</div>
      </div>
    </HoverPanel>
  );
}

function FaqBlock({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number>(0);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const active = idx === open;

        return (
          <div
            key={item.q}
            className={cn(
              "overflow-hidden rounded-[20px] border bg-black/40 transition",
              active ? "border-purple-300/16" : "border-white/10"
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(active ? -1 : idx)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <div className="text-[15px] font-semibold text-white">{item.q}</div>
              <div className="text-white/45">{active ? "−" : "+"}</div>
            </button>

            {active ? (
              <div className="border-t border-white/10 px-5 py-4 text-[14px] leading-relaxed text-white/58">
                {item.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function TraderOfferPanel({
  feeUsd = 160,
}: TraderOfferPanelProps) {
  const router = useRouter();

  const goChallenge = () => {
    router.push(`/challenge?level=l1&amount=${feeUsd}&method=qr`);
  };

  const goDashboard = () => {
    router.push("/dashboard");
  };

  const faqItems: FaqItem[] = [
    {
      q: "Do I need experience?",
      a: "Yes. This environment is designed for traders who already understand execution, discipline and risk management.",
    },
    {
      q: "Are Level 2 and Level 3 paid?",
      a: "No. Only Level 1 requires an entry. Level 2 and Level 3 unlock through performance.",
    },
    {
      q: "What happens if I fail?",
      a: "You can restart the challenge with a new entry and begin the path again.",
    },
    {
      q: "How do payouts work?",
      a: "Traders who perform inside the framework can access payout windows and a profit split based on level structure.",
    },
    {
      q: "Is this just another prop challenge?",
      a: "No. The goal is not only to pass a challenge. The goal is to enter a wider execution and routing ecosystem with progression.",
    },
  ];

  return (
    <>
      <section className="relative w-full overflow-hidden text-white">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(1200px 620px at 50% 0%, rgba(96,165,250,0.14), rgba(139,92,246,0.08), rgba(0,0,0,0.96)),
                radial-gradient(860px 460px at 50% 100%, rgba(59,130,246,0.12), transparent 60%),
                radial-gradient(660px 360px at 82% 18%, rgba(139,92,246,0.06), transparent 52%),
                #000
              `,
            }}
          />
          <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="absolute bottom-[-120px] left-1/2 h-[260px] w-[72%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.24),rgba(59,130,246,0.14),transparent_72%)] blur-3xl" />
        </div>

        <OrbitalDots />

        <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
          {/* top strip */}
          <HoverPanel>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[10px] tracking-[0.28em] text-white/40">
                  TRADER ENTRY · LEVEL ACCESS · QR CHECKOUT · FUNDED PROGRESSION
                </div>
                <div className="mt-2 text-[13px] text-white/68">
                  Built for traders who want structure, progression and real upside.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Chip>LEVEL 1 QR</Chip>
                <Chip tone="violet">LEVEL 2 FREE</Chip>
                <Chip tone="violet">LEVEL 3 FREE</Chip>
              </div>
            </div>
          </HoverPanel>

          {/* hero */}
          <div className="mx-auto mt-12 max-w-4xl text-center md:mt-16">
            <div className="text-[11px] tracking-[0.20em] text-white/46">
              INSTITUTIONAL TRADER ENVIRONMENT
            </div>
            <div className="mt-1 text-[11px] tracking-[0.18em] text-white/34">
              BUILT FOR DISCIPLINED OPERATORS
            </div>

            <div className="relative mt-6 flex items-center justify-center">
              <div className="pointer-events-none absolute h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.20),rgba(139,92,246,0.14),transparent_65%)] blur-3xl gravity-core-pulse" />

              <div
                className="relative rounded-[30px] border border-white/10 bg-black/55 px-7 py-5"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.05), 0 0 120px rgba(96,165,250,0.10)",
                }}
              >
                <img
                  src="/oglog.png"
                  alt="Bullions"
                  className="h-12 md:h-14 w-auto object-contain opacity-95"
                  draggable={false}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <NeutronCore size={62} />
            </div>

            <Eyebrow>TRADER ENTRY ONBOARDING</Eyebrow>

            <h1 className="mt-4 text-[42px] font-semibold tracking-tight text-white md:text-[76px] md:leading-[0.98]">
              Prove Your Edge.
              <br />
              Unlock Bigger Capital.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-[16px] leading-relaxed text-white/60 md:text-[18px]">
              Start with a one-time Level 1 challenge. Trade inside a clear risk
              framework, earn your progression, unlock larger capital tiers for
              free and move deeper into the Bullions execution ecosystem.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Chip>ONE-TIME ENTRY</Chip>
              <Chip tone="violet">STRUCTURED RULES</Chip>
              <Chip tone="violet">FUNDED PROGRESSION</Chip>
            </div>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={goChallenge}
                className="rounded-2xl border border-purple-300/20 bg-purple-500/[0.10] px-7 py-4 text-[13px] font-semibold tracking-[0.14em] uppercase text-white transition hover:bg-purple-500/[0.16]"
              >
                Enter Level 1 Challenge
              </button>

              <button
                onClick={goDashboard}
                className="rounded-2xl border border-white/12 bg-white/[0.04] px-7 py-4 text-[13px] font-semibold tracking-[0.14em] uppercase text-white/90 transition hover:bg-white/[0.08]"
              >
                Explore Dashboard
              </button>
            </div>
          </div>

          <SectionDivider />

          {/* live capital */}
          <div className="mt-10">
            <HoverPanel highlight>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                  <Eyebrow>LIVE CAPITAL ENVIRONMENT</Eyebrow>

                  <div className="mt-3 text-[44px] leading-none font-semibold tracking-tight text-white md:text-[64px]">
                    <LiveFundsCounter start={3903097} />
                  </div>

                  <div className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
                    Capital connected to the Bullions routing environment.
                    As your performance proves itself, the system can expand allocation
                    behind your execution through copy demand and AI-assisted routing logic.
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Chip tone="violet">AI FILTERED</Chip>
                    <Chip>COPY ROUTING</Chip>
                    <Chip tone="violet">LIVE DEMAND</Chip>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-[20px] border border-white/10 bg-black/35 p-4">
                    <div className="text-[10px] tracking-[0.18em] text-white/40">
                      ROUTING MODEL
                    </div>
                    <div className="mt-2 text-[15px] font-semibold text-white">
                      AI-assisted
                    </div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/55">
                      Signal filtering and execution support across the environment.
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-black/35 p-4">
                    <div className="text-[10px] tracking-[0.18em] text-white/40">
                      TRADER FOCUS
                    </div>
                    <div className="mt-2 text-[15px] font-semibold text-white">
                      Execution quality
                    </div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/55">
                      Traders focus on disciplined performance inside the framework.
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-black/35 p-4">
                    <div className="text-[10px] tracking-[0.18em] text-white/40">
                      SCALING PATH
                    </div>
                    <div className="mt-2 text-[15px] font-semibold text-white">
                      Allocation expansion
                    </div>
                    <div className="mt-2 text-[12px] leading-relaxed text-white/55">
                      Stronger performance can unlock deeper routed capital exposure.
                    </div>
                  </div>
                </div>
              </div>
            </HoverPanel>
          </div>

          <SectionDivider />

          {/* why this prop */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>WHAT YOU GAIN</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                Why choose this trader path?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[15px] text-white/56">
                A cleaner challenge experience, stronger upside after passing,
                and direct access to a capital progression system instead of a
                one-off test.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              <FeatureCard
                title="Clear progression"
                desc="Pay once for Level 1, then unlock Level 2 and Level 3 for free through performance."
              />
              <FeatureCard
                title="Real trader upside"
                desc="The reward is not only passing. The reward is larger capital access and stronger positioning inside the ecosystem."
              />
              <FeatureCard
                title="Bullions ecosystem"
                desc="After progression, traders move closer to copy environments, execution tools and structured growth paths."
              />
            </div>
          </div>

          <SectionDivider />

          {/* why traders fail elsewhere */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>WHY TRADERS FAIL ELSEWHERE</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                Most prop paths are built the wrong way
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[15px] text-white/56">
                Confusing rules, repeated fees and no real progression keep traders trapped in loops.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-[24px] border border-white/10 bg-black/40">
              <div className="grid grid-cols-2 gap-3 bg-white/[0.03] px-4 py-4 text-[11px] tracking-[0.18em] text-white/42">
                <div>TYPICAL PROP MODEL</div>
                <div>BULLIONS PATH</div>
              </div>

              <CompareRow left="Reset fees" right="One paid entry" />
              <CompareRow left="Multiple paid stages" right="Level 2 and 3 unlock free" />
              <CompareRow left="Static capital" right="Progressive capital ladder" />
              <CompareRow left="No ecosystem after passing" right="Copy + AI routing environment" />
            </div>
          </div>

          <SectionDivider />

          {/* path */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>TRADER PATH</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                A simple capital ladder
              </h2>
            </div>

            <div className="mt-8">
              <ProgressPath active={1} />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5">
              {[
                "Level 1 Challenge",
                "Unlock Level 2",
                "Unlock Level 3",
                "Routed Capital",
                "Copy Environment",
              ].map((item, idx) => (
                <HoverPanel key={item}>
                  <div className="text-[11px] tracking-[0.18em] text-white/38">
                    STEP {idx + 1}
                  </div>
                  <div className="mt-3 text-[18px] font-semibold text-white">{item}</div>
                </HoverPanel>
              ))}
            </div>
          </div>

          <SectionDivider />

          {/* metrics */}
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            <MiniMetric label="LEVEL 1 ENTRY" value={fmtUSD(feeUsd)} tone="violet" />
            <MiniMetric label="STARTING CAPITAL" value="$10K" />
            <MiniMetric label="PROFIT SPLIT" value="UP TO 80%" />
            <MiniMetric label="UNLOCK PATH" value="L2 → L3" tone="violet" />
          </div>

          <SectionDivider />

          {/* levels */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>LEVEL SYSTEM</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                Capital progression
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              <LevelCard
                level="Level 1"
                capital="$10,000"
                subtitle="ENTRY CHALLENGE"
                entry={`QR ${fmtUSD(feeUsd)}`}
                target="+10%"
                split="80%"
                bullets={[
                  "One-time challenge entry",
                  "Structured risk framework",
                  "Unlock Level 2 after successful performance",
                ]}
                cta="Accept the Challenge →"
                onClick={goChallenge}
                highlight
              />

              <LevelCard
                level="Level 2"
                capital="$25,000"
                subtitle="FREE UNLOCK"
                entry="PERFORMANCE"
                target="+8%"
                split="85%"
                bullets={[
                  "Unlocked automatically after progression",
                  "Higher capital allocation",
                  "No second payment required",
                ]}
                cta="Unlocked via performance"
                onClick={goDashboard}
              />

              <LevelCard
                level="Level 3"
                capital="$50,000+"
                subtitle="ELITE TIER"
                entry="ADVANCED"
                target="+6%"
                split="90%"
                bullets={[
                  "Top progression layer",
                  "Best capital profile in the path",
                  "Built for consistent traders",
                ]}
                cta="Institutional tier"
                onClick={goDashboard}
              />
            </div>
          </div>

          <SectionDivider />

          {/* rules */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>CHALLENGE FRAMEWORK</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                Rules are clear
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <MiniMetric label="PROFIT TARGET" value="10%" tone="good" />
              <MiniMetric label="MAX LOSS" value="10%" tone="bad" />
              <MiniMetric label="DAILY LOSS" value="5%" tone="bad" />
              <MiniMetric label="MIN DAYS" value="3" />
            </div>
          </div>

          <SectionDivider />

          {/* how it works */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>HOW IT WORKS</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                Simple progression logic
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-4">
              <StepCard
                step="1"
                title="Pay entry"
                desc="Activate the Level 1 challenge through secure QR checkout."
              />
              <StepCard
                step="2"
                title="Trade with discipline"
                desc="Stay inside the risk framework and work toward the target."
              />
              <StepCard
                step="3"
                title="Unlock more capital"
                desc="Passing performance unlocks higher levels for free."
              />
              <StepCard
                step="4"
                title="Enter the ecosystem"
                desc="Move toward copy environments and Bullions execution tools."
              />
            </div>
          </div>

          <SectionDivider />

          {/* expected upside */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>EXPECTED UPSIDE</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                Example trader path
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[15px] text-white/56">
                Not a guarantee. Just a simple example of how progression can become more meaningful as capital grows.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <UpsideCard
                level="LEVEL 1"
                capital="$10,000"
                move="+8%"
                gross="$800"
                split="80%"
                payout="$640"
              />
              <UpsideCard
                level="LEVEL 2"
                capital="$25,000"
                move="+8%"
                gross="$2,000"
                split="85%"
                payout="$1,700"
              />
            </div>
          </div>

          <SectionDivider />

          {/* payout */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>PAYOUT STRUCTURE</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                What’s the reward?
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              <FeatureCard
                title="Up to 80% split"
                desc="Successful traders keep a strong portion of generated profits."
              />
              <FeatureCard
                title="Payout windows"
                desc="Structured payout logic gives clarity instead of random hidden conditions."
              />
              <FeatureCard
                title="Capital scaling"
                desc="The real prize is larger capital access and stronger trader positioning."
              />
            </div>
          </div>

          <SectionDivider />

          {/* social proof */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>SOCIAL PROOF</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                Why people trust this path
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              <SocialProofCard
                title="ACTIVE TRADERS"
                value="+4,300"
                sub="Operators inside the broader Bullions ecosystem."
              />
              <SocialProofCard
                title="COMMUNITY RATING"
                value="4.8 / 5"
                sub="High trust perception driven by clarity and progression."
              />
              <SocialProofCard
                title="UNLOCK EVENTS"
                value="DAILY"
                sub="Level progression, payouts and copy-ready operators."
              />
            </div>

            <div className="mt-6">
              <LiveFeed />
            </div>
          </div>

          <SectionDivider />

          {/* recent unlocks */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>RECENT ACTIVITY</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                Recent unlocks and payouts
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <HoverPanel>
                <div className="text-[10px] tracking-[0.18em] text-white/40">TRADER SIGMA</div>
                <div className="mt-2 text-[24px] font-semibold text-white">$2,430</div>
                <div className="mt-2 text-[13px] text-white/56">Recent payout window completed.</div>
              </HoverPanel>

              <HoverPanel>
                <div className="text-[10px] tracking-[0.18em] text-white/40">TRADER ATLAS</div>
                <div className="mt-2 text-[24px] font-semibold text-white">LEVEL 2</div>
                <div className="mt-2 text-[13px] text-white/56">Unlocked after compliant performance.</div>
              </HoverPanel>

              <HoverPanel>
                <div className="text-[10px] tracking-[0.18em] text-white/40">TRADER ORION</div>
                <div className="mt-2 text-[24px] font-semibold text-white">$3,210</div>
                <div className="mt-2 text-[13px] text-white/56">Entered copy-ready environment.</div>
              </HoverPanel>
            </div>
          </div>

          <SectionDivider />

          {/* identity */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>TRADER IDENTITY</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                This is not for everyone
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[15px] text-white/56">
                Built for disciplined traders who want structure, progression and a serious path to bigger capital.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <HoverPanel>
                <div className="text-[18px] font-semibold text-white">Built for</div>
                <div className="mt-4 space-y-3 text-[14px] text-white/60">
                  <div>• disciplined operators</div>
                  <div>• risk-aware execution</div>
                  <div>• traders focused on edge, not noise</div>
                </div>
              </HoverPanel>

              <HoverPanel>
                <div className="text-[18px] font-semibold text-white">Not built for</div>
                <div className="mt-4 space-y-3 text-[14px] text-white/60">
                  <div>• gamblers</div>
                  <div>• signal chasers</div>
                  <div>• emotional overtrading</div>
                </div>
              </HoverPanel>
            </div>
          </div>

          <SectionDivider />

          {/* copy ecosystem */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>COPY ENVIRONMENT</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                What opens after passing?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[15px] text-white/56">
                Stronger positioning inside the Bullions environment, including
                access to trader visibility and copy flows.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              <TraderCard
                name="Trader Alpha"
                roi="+32%"
                desc="Consistent operator with strong risk control and copy interest."
                onCopy={goDashboard}
              />
              <TraderCard
                name="Trader Sigma"
                roi="+27%"
                desc="Balanced execution profile ready for structured follower flows."
                onCopy={goDashboard}
              />
              <TraderCard
                name="Trader Orion"
                roi="+41%"
                desc="Aggressive but controlled trader with strong community attention."
                onCopy={goDashboard}
              />
            </div>
          </div>

          <SectionDivider />

          {/* faq */}
          <div className="mt-10">
            <div className="text-center">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-white">
                Questions traders actually ask
              </h2>
            </div>

            <div className="mt-8">
              <FaqBlock items={faqItems} />
            </div>
          </div>

          <SectionDivider />

          {/* final cta */}
          <div className="mt-12 text-center">
            <HoverPanel highlight>
              <div className="mx-auto max-w-3xl">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.18),rgba(139,92,246,0.12),transparent_70%)] blur-2xl gravity-core-pulse" />
                    <NeutronCore size={60} />
                  </div>
                </div>

                <h2 className="mt-5 text-[34px] font-semibold tracking-tight text-white">
                  The trader path starts here.
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-[15px] text-white/58">
                  One payment. Clear rules. Bigger capital path. Bullions ecosystem entry.
                </p>

                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    onClick={goChallenge}
                    className="rounded-2xl border border-purple-300/20 bg-purple-500/[0.10] px-7 py-4 text-[13px] font-semibold tracking-[0.14em] uppercase text-white transition hover:bg-purple-500/[0.16]"
                  >
                    Accept Level 1 Challenge
                  </button>

                  <button
                    onClick={goDashboard}
                    className="rounded-2xl border border-white/12 bg-white/[0.04] px-7 py-4 text-[13px] font-semibold tracking-[0.14em] uppercase text-white/90 transition hover:bg-white/[0.08]"
                  >
                    Explore Dashboard
                  </button>
                </div>
              </div>
            </HoverPanel>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes neutronOrbitA {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes neutronOrbitB {
          0% { transform: rotate(0deg) scale(1); opacity: 0.22; }
          50% { opacity: 0.48; }
          100% { transform: rotate(-360deg) scale(1); opacity: 0.22; }
        }

        @keyframes neutronOrbitC {
          0% { transform: rotate(0deg); opacity: 0.24; }
          50% { opacity: 0.55; }
          100% { transform: rotate(360deg); opacity: 0.24; }
        }

        @keyframes gravityCorePulse {
          0% { transform: scale(0.96); opacity: 0.72; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.96); opacity: 0.72; }
        }

        @keyframes feedIn {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .neutron-orbit-a {
          animation: neutronOrbitA 4.8s linear infinite;
          will-change: transform;
        }

        .neutron-orbit-b {
          animation: neutronOrbitB 6.1s linear infinite;
          will-change: transform, opacity;
        }

        .neutron-orbit-c {
          animation: neutronOrbitC 8.2s linear infinite;
          will-change: transform, opacity;
        }

        .gravity-core-pulse {
          animation: gravityCorePulse 4.4s ease-in-out infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </>
  );
}