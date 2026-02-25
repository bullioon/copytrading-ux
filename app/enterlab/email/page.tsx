"use client"

import { useMemo, useState } from "react"
import QRCode from "react-qr-code"

const SOLANA_WALLET = "6A7UUr1x9kK1gkPmE1ys2s7H2zii289j27KvRsBX1q3f"
const BTC_WALLET = "bc1pdy4kzyknk0dqsdcna2lmv2emg88p45r3ln2fs96nxj9tqc5hf68qhchzl9"

type Amount = 300 | 500 | 1000
type Chain = "SOL" | "BTC"

export default function EmailLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [amount, setAmount] = useState<Amount>(300)

  const [depositId, setDepositId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>("")

  const [chain, setChain] = useState<Chain>("SOL")

  const bonusMap: Record<Amount, number> = {
    300: 80,
    500: 200,
    1000: 500,
  }
  const bonus = bonusMap[amount]

  const isEmailOk = useMemo(() => /^\S+@\S+\.\S+$/.test(email.trim()), [email])
  const isPassOk = useMemo(() => password.trim().length >= 6, [password])

  const canCreate = isEmailOk && isPassOk && !creating

  const payAddress = chain === "SOL" ? SOLANA_WALLET : BTC_WALLET
  const payLabel = chain === "SOL" ? "Solana" : "Bitcoin"

  async function createDeposit() {
    setError("")
    if (!canCreate) {
      setError("Enter a valid email + password (min 6 chars).")
      return
    }

    setCreating(true)
    try {
      const r = await fetch("/api/enterlab/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          depositAmount: amount,
          // password: password, // ⚠️ ahorita NO lo mandes si no tienes auth server
        }),
      })

      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "Failed to create deposit")

      setDepositId(j?.id || null)

      // cuando ya hay deposit, puedes fijar chain default si quieres:
      setChain("SOL")
    } catch (e: any) {
      setError(e?.message || "Failed to create deposit")
    } finally {
      setCreating(false)
    }
  }

  function copyAddress() {
    navigator.clipboard.writeText(payAddress)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* background bunker suave */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(1200px 620px at 50% 0%, rgba(0,255,160,0.08), rgba(0,0,0,0.92)),
            radial-gradient(900px 560px at 50% 38%, rgba(168,85,247,0.06), rgba(0,0,0,0.96)),
            radial-gradient(650px 460px at 50% 58%, rgba(255,255,255,0.03), rgba(0,0,0,0.985)),
            #000
          `,
        }}
      />
      <div className="px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-[10px] tracking-[0.26em] text-white/50">ENTERLAB · EMAIL LOGIN</div>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-white/90">
            Create a deposit. Unlock routing credit.
          </h1>
          <div className="mt-2 text-[12px] tracking-widest text-white/60">
            Bonuses are limited · non-withdrawable · routing credit only.
          </div>

          {/* CARD */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-black/55 p-6 md:p-7"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 30px 130px rgba(0,0,0,0.55)" }}
          >
            {/* Account */}
            <div className="text-[10px] tracking-[0.26em] text-white/45">ACCOUNT</div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                placeholder="Email"
                className={[
                  "w-full rounded-2xl bg-black/60 border px-4 py-3 text-[12px] tracking-widest outline-none",
                  isEmailOk ? "border-white/15 focus:border-white/25" : "border-white/10 focus:border-red-400/30",
                ].join(" ")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password (min 6)"
                className={[
                  "w-full rounded-2xl bg-black/60 border px-4 py-3 text-[12px] tracking-widest outline-none",
                  isPassOk ? "border-white/15 focus:border-white/25" : "border-white/10 focus:border-red-400/30",
                ].join(" ")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Deposit select */}
            <div className="mt-6 flex items-end justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-[0.26em] text-white/45">SELECT DEPOSIT</div>
                <div className="mt-2 text-[12px] tracking-widest text-white/65">
                  Bonus applies as routing credit.
                </div>
              </div>

              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.10] px-3 py-1 text-[10px] tracking-widest text-emerald-100">
                +${bonus} bonus
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[300, 500, 1000].map((v) => {
                const active = amount === v
                const b = bonusMap[v as Amount]
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v as Amount)}
                    className={[
                      "text-left rounded-3xl border p-5 transition",
                      active ? "border-emerald-300/35 bg-emerald-300/[0.08]" : "border-white/10 bg-black/40 hover:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <div className="text-[10px] tracking-[0.26em] text-white/55">DEPOSIT</div>
                    <div className="mt-2 text-3xl font-semibold text-white">${v}</div>
                    <div className="mt-3 text-[12px] tracking-widest text-white/80">
                      Bonus credit: <span className="text-emerald-200 font-semibold">+${b}</span>
                    </div>
                    <div className="mt-3 text-[11px] tracking-widest text-white/55 leading-relaxed">
                      Limited · non-withdrawable · routing credit only
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 text-[11px] tracking-widest text-white/55">
              • bonuses are limited. not withdrawable. used for routing credit only.
            </div>

            {/* Create deposit */}
            <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3">
              <button
                type="button"
                onClick={createDeposit}
                disabled={!canCreate || !!depositId}
                className={[
                  "rounded-2xl border px-6 py-4 text-[12px] font-semibold tracking-widest transition",
                  depositId
                    ? "border-white/10 bg-white/[0.04] text-white/45 cursor-not-allowed"
                    : canCreate
                      ? "border-emerald-300/25 bg-emerald-300/[0.10] text-emerald-100 hover:bg-emerald-300/[0.14]"
                      : "border-white/10 bg-white/[0.04] text-white/45 cursor-not-allowed",
                ].join(" ")}
              >
                {depositId ? "DEPOSIT CREATED ✓" : creating ? "CREATING…" : "CREATE DEPOSIT ▸"}
              </button>

              <div className="text-[11px] tracking-widest text-white/55">
                Creates a pending deposit record (server-side).
              </div>
            </div>

            {error ? (
              <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3 text-[12px] tracking-widest text-red-100">
                {error}
              </div>
            ) : null}

            {depositId ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-[12px] tracking-widest text-white/75">
                Deposit ID: <span className="text-white/90 font-semibold">{depositId}</span>
              </div>
            ) : null}
          </div>

          {/* PAYMENT SECTION — only after depositId */}
          {depositId ? (
            <div className="mt-8 rounded-3xl border border-white/10 bg-black/55 p-6 md:p-7"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 30px 130px rgba(0,0,0,0.55)" }}
            >
              {/* Banner */}
              <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.08] p-5">
                <div className="text-[10px] tracking-[0.26em] text-emerald-100/80">PAYMENT</div>
                <div className="mt-2 text-[18px] md:text-[20px] font-semibold text-white/90">
                  Scan QR or copy the address 🔗
                </div>
                <div className="mt-1 text-[12px] tracking-widest text-white/65">
                  Send <span className="text-white/90 font-semibold">${amount}</span> to confirm this deposit.
                </div>
              </div>

              {/* Chain selector */}
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChain("SOL")}
                  className={[
                    "rounded-full border px-4 py-2 text-[11px] tracking-widest transition",
                    chain === "SOL" ? "border-emerald-300/25 bg-emerald-300/[0.10] text-emerald-100" : "border-white/10 bg-black/40 text-white/70 hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  SOLANA
                </button>
                <button
                  type="button"
                  onClick={() => setChain("BTC")}
                  className={[
                    "rounded-full border px-4 py-2 text-[11px] tracking-widest transition",
                    chain === "BTC" ? "border-purple-300/25 bg-purple-500/[0.12] text-purple-100" : "border-white/10 bg-black/40 text-white/70 hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  BITCOIN
                </button>
              </div>

              {/* QR + address */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                <div className="rounded-3xl border border-white/10 bg-black/50 p-5 flex items-center justify-center">
                  <div className="rounded-2xl bg-white p-3">
                    <QRCode value={payAddress} size={190} />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/50 p-5">
                  <div className="text-[10px] tracking-[0.26em] text-white/45">SEND TO</div>
                  <div className="mt-2 text-[14px] font-semibold text-white/90">{payLabel}</div>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/60 p-4 text-[12px] tracking-widest text-white/70 break-all">
                    {payAddress}
                  </div>

                  <button
                    type="button"
                    onClick={copyAddress}
                    className="mt-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-[12px] tracking-widest text-white/85 hover:bg-white/[0.06] hover:border-white/25 transition"
                  >
                    COPY ADDRESS ▸
                  </button>

                  <div className="mt-4 text-[11px] tracking-widest text-white/55 leading-relaxed">
                    Tip: include your <span className="text-white/80 font-semibold">Deposit ID</span> in the memo/note if supported.
                    <div className="mt-2 text-white/70">
                      ID: <span className="text-white/90 font-semibold">{depositId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}