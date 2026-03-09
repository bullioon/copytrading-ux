"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

function fmtUSD(n: number) {
  return Number(n || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

type ChallengeOrder = {
  id: string;
  type: string;
  level: string;
  amountUsd: number;
  asset: "SOL" | "BTC";
  walletAddress: string;
  status: "pending" | "confirmed";
  createdAt: number;
  txHash?: string | null;
  challengeActivated?: boolean;
};

export default function ChallengeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const level = (searchParams.get("level") || "l1").toUpperCase();
  const method = (searchParams.get("method") || "qr").toLowerCase();
  const amount = Number(searchParams.get("amount") || 160);

  const [asset, setAsset] = useState<"SOL" | "BTC">("SOL");
  const [invoice, setInvoice] = useState<ChallengeOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const config = useMemo(() => {
    return {
      title: "10K Direct Funding",
      subtitle: "Level 1 · Entry challenge",
      rules: [
        "Max overall loss: 10%",
        "Max daily loss: 5%",
        "Profit target: 10%",
        "Minimum 3 trading days",
      ],
    };
  }, []);

  async function createInvoice() {
    try {
      setLoading(true);
      setError("");
      setInvoice(null);
      setCopied(false);

      const res = await fetch("/challenge/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level,
          amount,
          asset,
          userId: null,
        }),
      });

      const raw = await res.text();

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("Challenge create raw response:", raw);
        throw new Error("Challenge create route returned HTML instead of JSON");
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to create invoice");
      }

      setInvoice(data.order);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus(id: string) {
    try {
      const res = await fetch(`/challenge/status?id=${encodeURIComponent(id)}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) return;

      setInvoice(data.order);

      if (data.order?.status === "confirmed" && data.order?.challengeActivated) {
        setTimeout(() => {
          router.push("/dashboard?challenge=active&level=l1");
        }, 1000);
      }
    } catch {
      // polling silencioso
    }
  }

  async function mockConfirm() {
    if (!invoice?.id) return;

    try {
      setConfirming(true);
      setError("");

      const res = await fetch("/challenge/mock-confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: invoice.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to confirm invoice");
      }

      setInvoice(data.order);
    } catch (err: any) {
      setError(err?.message || "Failed to confirm");
    } finally {
      setConfirming(false);
    }
  }

  async function copyAddress() {
    if (!invoice?.walletAddress) return;

    try {
      await navigator.clipboard.writeText(invoice.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Failed to copy address");
    }
  }

  useEffect(() => {
    if (!invoice?.id) return;
    if (invoice.status === "confirmed") return;

    const timer = setInterval(() => {
      checkStatus(invoice.id);
    }, 4000);

    return () => clearInterval(timer);
  }, [invoice?.id, invoice?.status]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#08080b_0%,#050507_100%)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] tracking-[0.22em] text-white/45">
              CHALLENGE CHECKOUT
            </div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-white/95">
              Accept the Challenge
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Complete the access payment to unlock your trader challenge.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
          >
            Back
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,26,0.95),rgba(10,10,14,0.98))] p-5 ring-1 ring-violet-400/15 shadow-[0_0_80px_rgba(168,85,247,0.10)]">
            <div className="text-[10px] tracking-[0.22em] text-white/45">CHALLENGE</div>

            <div className="mt-2 text-[24px] font-semibold text-white/92">
              {config.title}
            </div>

            <div className="mt-1 text-sm text-white/55">{config.subtitle}</div>

            <div className="mt-5 rounded-[20px] border border-violet-300/20 bg-violet-500/10 p-4">
              <div className="text-[10px] tracking-[0.18em] text-violet-200/70">
                TOTAL
              </div>
              <div className="mt-1 text-[30px] font-semibold tracking-tight text-violet-200">
                {fmtUSD(amount)}
              </div>
            </div>

            <div className="mt-5 rounded-[20px] border border-emerald-300/18 bg-emerald-500/[0.08] p-4">
              <div className="text-[10px] tracking-[0.2em] text-emerald-200/72">
                LEVEL LOGIC
              </div>
              <div className="mt-2 text-sm leading-relaxed text-emerald-50/90">
                This payment unlocks the trader challenge access. After confirmation,
                your Level 1 trader environment activates automatically.
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {config.rules.map((rule) => (
                <div
                  key={rule}
                  className="rounded-[18px] border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75"
                >
                  {rule}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/10 bg-black/40 p-5 ring-1 ring-white/8">
            <div className="text-[10px] tracking-[0.22em] text-white/45">PAYMENT PANEL</div>

            <div className="mt-2 text-[22px] font-semibold text-white/92">
              {method === "phantom" ? "Phantom Payment" : "QR Payment"}
            </div>

            <div className="mt-2 text-sm text-white/55">
              Generate the payment invoice and send crypto to activate the challenge.
            </div>

            <div className="mt-5 flex gap-2">
              {(["SOL", "BTC"] as const).map((item) => {
                const active = asset === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAsset(item)}
                    className={
                      active
                        ? "rounded-full border border-violet-300/20 bg-violet-500/12 px-4 py-2 text-sm text-violet-200"
                        : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
                    }
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={createInvoice}
              disabled={loading}
              className="mt-5 w-full rounded-[18px] border border-violet-300/20 bg-violet-500/14 px-4 py-3 text-sm font-semibold text-violet-100 hover:bg-violet-500/20 disabled:opacity-60"
            >
              {loading ? "Creating invoice..." : "Generate Payment QR"}
            </button>

            {error ? (
              <div className="mt-4 rounded-[14px] border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-6 rounded-[20px] border border-dashed border-white/12 bg-white/[0.03] p-6">
              {!invoice ? (
                <div className="flex min-h-[340px] items-center justify-center text-sm text-white/40">
                  Generate invoice to show QR
                </div>
              ) : (
                <div className="mx-auto w-full max-w-md">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] tracking-[0.2em] text-white/42">
                      PAYMENT REQUEST
                    </div>

                    <div
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                        invoice.status === "confirmed"
                          ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-200"
                          : "border-amber-300/20 bg-amber-500/10 text-amber-100"
                      }`}
                    >
                      {invoice.status === "confirmed" ? "Confirmed" : "Waiting for payment"}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <div className="rounded-[20px] bg-white p-3 shadow-[0_0_40px_rgba(255,255,255,0.06)]">
                      <QRCodeSVG value={invoice.walletAddress} size={210} />
                    </div>
                  </div>

                  <div className="mt-4 text-center text-sm text-white/68">
                    Send <span className="font-semibold text-white">{invoice.asset}</span>{" "}
                    equivalent of{" "}
                    <span className="font-semibold text-white">
                      {fmtUSD(invoice.amountUsd)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-[18px] border border-white/10 bg-black/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] tracking-[0.18em] text-white/40">
                          DESTINATION WALLET
                        </div>
                        <div className="mt-2 break-all text-[11px] text-white/78">
                          {invoice.walletAddress}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={copyAddress}
                        className="shrink-0 rounded-[14px] border border-violet-300/20 bg-violet-500/10 px-3 py-2 text-[11px] font-medium text-violet-200 hover:bg-violet-500/16"
                      >
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.03] p-4 text-left">
                    <div className="text-[10px] tracking-[0.18em] text-white/40">ORDER ID</div>
                    <div className="mt-1 break-all text-sm text-white/85">{invoice.id}</div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-[14px] border border-white/8 bg-black/30 p-3">
                        <div className="text-[10px] tracking-[0.18em] text-white/40">
                          LEVEL
                        </div>
                        <div className="mt-1 text-sm text-white/80">{invoice.level}</div>
                      </div>

                      <div className="rounded-[14px] border border-white/8 bg-black/30 p-3">
                        <div className="text-[10px] tracking-[0.18em] text-white/40">
                          ASSET
                        </div>
                        <div className="mt-1 text-sm text-white/80">{invoice.asset}</div>
                      </div>

                      <div className="rounded-[14px] border border-white/8 bg-black/30 p-3">
                        <div className="text-[10px] tracking-[0.18em] text-white/40">
                          STATUS
                        </div>
                        <div
                          className={`mt-1 text-sm font-medium ${
                            invoice.status === "confirmed"
                              ? "text-emerald-300"
                              : "text-amber-200"
                          }`}
                        >
                          {invoice.status}
                        </div>
                      </div>

                      <div className="rounded-[14px] border border-white/8 bg-black/30 p-3">
                        <div className="text-[10px] tracking-[0.18em] text-white/40">
                          AMOUNT
                        </div>
                        <div className="mt-1 text-sm text-white/80">
                          {fmtUSD(invoice.amountUsd)}
                        </div>
                      </div>
                    </div>

                    {invoice.txHash ? (
                      <div className="mt-4 rounded-[14px] border border-emerald-300/10 bg-emerald-500/[0.05] p-3">
                        <div className="text-[10px] tracking-[0.18em] text-emerald-200/60">
                          TX HASH
                        </div>
                        <div className="mt-1 break-all text-xs text-emerald-300">
                          {invoice.txHash}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {process.env.NODE_ENV === "development" ? (
                    <button
                      type="button"
                      onClick={mockConfirm}
                      disabled={confirming || invoice.status === "confirmed"}
                      className="mt-4 w-full rounded-[16px] border border-emerald-300/20 bg-emerald-500/12 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/18 disabled:opacity-60"
                    >
                      {invoice.status === "confirmed"
                        ? "Challenge Activated"
                        : confirming
                        ? "Confirming..."
                        : "Mock Confirm Payment"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => checkStatus(invoice.id)}
                      className="mt-4 w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/84 hover:bg-white/10"
                    >
                      Refresh status
                    </button>
                  )}

                  <div className="mt-3 text-center text-xs text-white/45">
                    Polling order status every 4 seconds.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/62">
              After confirmation, activate the trader challenge instead of crediting
              spendable wallet balance.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}