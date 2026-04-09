"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

/* ⚛️ LOGO SUAVE */
function AtomLogo({ large = false }) {
  return (
    <div
      className={`
        group relative flex items-center justify-center
        ${large ? "w-32 h-32" : "w-12 h-12"}
        rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden
      `}
    >
      <div className="absolute w-[140%] h-[140%] bg-purple-500/20 blur-3xl rounded-full opacity-70 group-hover:opacity-100 transition" />
      <div className="absolute w-2 h-2 bg-white rounded-full opacity-80" />
      <div className="proton proton-a" />
      <div className="proton proton-b" />
      <div className="proton proton-c" />
      <div className="absolute inset-0 rounded-xl border border-purple-400/10 animate-spin-slow group-hover:animate-none opacity-40" />
    </div>
  );
}

/* 🔥 LIVE BUYERS */
function LiveBuyers() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);

  const names = ["Alex", "Daniel", "Chris", "Michael", "David"];
  const countries = ["USA", "UK", "Germany", "Canada"];

  useEffect(() => {
    const i = setInterval(() => {
      const n = names[Math.floor(Math.random() * names.length)];
      const c = countries[Math.floor(Math.random() * countries.length)];

      setMsg(`${n} from ${c} just joined`);
      setShow(true);

      setTimeout(() => setShow(false), 4000);
    }, 7000);

    

    return () => clearInterval(i);
  }, []);

  
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-xl text-sm shadow-2xl">
        {msg}
      </div>
    </div>
  );
}


{/* 🔥 TRADING GRID BACKGROUND PRO */}
<div className="absolute inset-0 -z-10 overflow-hidden">

  {/* GRID BASE */}
  <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />

  {/* GLOW VERDE (branding trading) */}
  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />

  {/* PUNTOS QUE "VIVEN" */}
  <div className="absolute inset-0">
    {Array.from({ length: 80 }).map((_, i) => (
      <div
        key={i}
        className="absolute w-[2px] h-[2px] bg-green-400 rounded-full opacity-20 animate-pulse"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
        }}
      />
    ))}
  </div>

  {/* GRADIENT OSCURO BASE */}
  <div className="absolute inset-0 bg-[#030305]/90" />

</div>


/* 🧠 APPLE STYLE SECTION */
function DataSection() {
  return (
    <section className="relative py-32">
      <div className="absolute w-[900px] h-[400px] bg-purple-600/20 blur-[200px] rounded-full left-1/2 -translate-x-1/2"></div>

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 md:p-14">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">
              Precision over noise
            </h2>
            <p className="text-white/60 max-w-xl mx-auto mb-8">
              Hellion AI connects directly to Myfxbook and executes only what matters.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-6 text-sm">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-xl">
                Real-time data <br />
                <span className="text-white/40">from top traders</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-xl">
                AI filtering <br />
                <span className="text-white/40">risk & probability</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-xl">
                Direct execution <br />
                <span className="text-white/40">into your MT5</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col gap-3 flex-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[6px] rounded-full bg-gradient-to-r from-transparent via-purple-400/40 to-transparent animate-pulse"
                />
              ))}
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute w-28 h-28 bg-purple-500/20 blur-3xl rounded-full"></div>
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.35)]">
                <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="flex flex-col gap-4 flex-1 items-end">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[8px] w-[70%] rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* SOCIAL PROOF */
function SocialProof() {
  const items = [
    { name: "Daniel K.", country: "USA", balance: "$500", profit: "$3,098", text: "Few trades, but the win rate is solid." },
    { name: "Alex R.", country: "UK", balance: "$1,000", profit: "$5,890", text: "Recovered my losing month with this." },
    { name: "Chris M.", country: "Germany", balance: "$1,300", profit: "$7,004", text: "Thanks AX, this actually helped me stay consistent." },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 pb-28">
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">
        Real users. Real results.
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((t, i) => (
          <div key={i} className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl overflow-hidden group">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-indigo-500/20 opacity-40 blur-xl group-hover:opacity-70 transition" />
            <div className="absolute inset-0 bg-white/[0.02]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <AtomLogo />
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-white/40">{t.country}</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-xs text-white/40">Balance → Profit</div>
                <div className="text-lg font-semibold tracking-wide">
                  <span className="text-white/70">{t.balance}</span>
                  <span className="mx-2 text-white/30">→</span>
                  <span className="text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.7)]">{t.profit}</span>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{t.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* DISCORD CTA */
function DiscordCTA() {
  return (
    <section className="text-center pb-32">
      <h2 className="text-2xl font-semibold mb-4">Join the Private Discord</h2>
      <p className="text-white/60 mb-6">Execution insights, updates and direct access.</p>
      <a
        href="https://discord.gg/YkFBXRD6rz" // <- Pon aquí tu link real
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105 transition shadow-lg"
      >
        Access Discord
      </a>
    </section>
  );
}

/* ---------------------- PAGE ---------------------- */
type Plan = "MT5" | "Dashboard";

export default function Page() {
  const [licenses, setLicenses] = useState(23);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<Plan | null>(null);
  const [paymentMethod] = useState("SOL"); // o "BTC"
  const [timer, setTimer] = useState(27 * 60); // 27 minutos
  const [email, setEmail] = useState("");
  const [candles, setCandles] = useState<number[]>([]);

  const solPrice = 150; // ⚠️ puedes cambiarlo luego
const getAmount = () => {
  const usd = paymentPlan === "MT5" ? 399 : 300;
  return (usd / solPrice).toFixed(2);
};



  useEffect(() => {
    const i = setInterval(() => {
      setLicenses((p) => (p > 5 ? p - 1 : p));
    }, 8000);
    return () => clearInterval(i);
  }, []);

  const handlePayment = (plan: Plan) => {
    setCreatingOrder(true);
    setTimeout(() => {
      setCreatingOrder(false);
      setPaymentPlan(plan);
      setShowPayment(true);
    }, 1500);
  };

  
  // Timer para cancelar la transacción si expira
  useEffect(() => {
    if (!showPayment) return;
    setTimer(27 * 60); // reinicia timer al abrir

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setShowPayment(false);
          alert("Payment expired. Transaction canceled.");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showPayment]);

  useEffect(() => {
  const data = Array.from({ length: 120 }).map(() => 20 + Math.random() * 120);
  setCandles(data);
}, []);


  return (
<main className="relative min-h-screen text-white overflow-hidden bg-black">
    <LiveBuyers />

{/* 🔥 TRADING + TECH BACKGROUND */}
<div className="absolute inset-0 -z-10 overflow-hidden">

  {/* GRID PRO */}
  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

  {/* CANDLES MÁS REALISTAS */}
  <div className="absolute bottom-0 w-full flex justify-center gap-[2px] opacity-20">
   
{candles.map((h, i) => (
  <div
    key={i}
    className={`w-[3px] ${
      i % 2 === 0
        ? "bg-gradient-to-t from-green-500 to-green-300 shadow-[0_0_6px_rgba(34,197,94,0.6)]"
        : "bg-gradient-to-t from-red-500 to-red-300 shadow-[0_0_6px_rgba(239,68,68,0.6)]"
    }`}
    style={{
      height: `${h}px`,
    }}
      />
    ))}
  </div>

  {/* GLOW CENTRAL */}
  <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-purple-600/20 blur-[180px] rounded-full" />

</div>

      {/* BACKGROUND PRO */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:26px_26px]" />
        <div className="absolute bottom-[-250px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-purple-700/40 blur-[220px] rounded-full"></div>
        <div className="absolute top-[-200px] right-[-100px] w-[700px] h-[700px] bg-indigo-600/20 blur-[180px] rounded-full"></div>
      </div>

      {/* NAV */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AtomLogo />
          <span className="font-semibold tracking-wide">MTAFX6</span>
        </div>
        <div className="text-sm text-white/50 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-xl">
          AI Execution System
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center pt-24 pb-16 px-6 max-w-5xl mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="relative px-6 py-2 rounded-full backdrop-blur-xl border border-red-500/20 bg-red-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent blur-xl opacity-60" />
            <div className="relative flex items-center gap-2 text-sm">
              <span className="text-white/50">Only</span>
              <span className="text-white font-semibold tracking-wide drop-shadow-[0_0_6px_rgba(255,80,80,0.8)]">{licenses}</span>
              <span className="text-red-400/80">/ 99 licenses left</span>
            </div>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-semibold leading-tight">
          Trade like the top 1%. <br />
          <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            without trading.
          </span>
        </h1>

        <p className="text-white/60 mt-6 text-lg max-w-xl mx-auto">
          MTAFX6 analyzes top traders in real time and executes only high-probability trades —
          protecting capital and removing emotional decision-making.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4 mt-10">
          <button onClick={() => handlePayment("MT5")} className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:scale-105 transition shadow-lg">
            Connect MT5 — $399/mo
          </button>
          <button onClick={() => handlePayment("Dashboard")} className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition">
            Use Dashboard — $300 + $150 bonus
          </button>
        </div>

        <div className="mt-10 text-xs text-white/40 max-w-xl mx-auto leading-relaxed">
          90% of traders lose their money, while a small percentage captures most profits.
          This is a high-risk industry. MTAFX6 uses data to improve probability outcomes,
          but no system guarantees results. Do not risk money you cannot afford to lose.
        </div>
      </section>

      <DataSection />
      <SocialProof />
      <DiscordCTA />

      {/* POPUPS */}
      {creatingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl">
          <div className="bg-[#0b0b0f] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-semibold mb-4">Creating order...</h2>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl">
          <div className="bg-[#0b0b0f] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center relative">
            <button onClick={() => setShowPayment(false)} className="absolute top-3 right-3 text-white/40 hover:text-white">✕</button>
            <h2 className="text-2xl font-semibold mb-2">Waiting for payment</h2>
            <p className="text-white/60 mb-2">{paymentPlan === "MT5" ? "Connect MT5 — $399" : "Dashboard — $300 + $150 bonus"}</p>

<input
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full mb-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-purple-400 transition"
/>


<p className="text-sm text-white/40 mb-4">
  Send exactly: <span className="text-white font-semibold">{getAmount()} SOL</span>
</p>

{email && !email.includes("@") && (
  <p className="text-xs text-red-400 mb-2">
    Enter a valid email
  </p>
)}
 
<QRCodeCanvas
  value={`solana:Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR?amount=${getAmount()}`}
              size={192}
              bgColor="#0b0b0f"
              fgColor="#fff"
              className="mx-auto mb-4 rounded-xl border border-white/10"
            />

            <p className="text-xs text-white/40 break-all mb-2">
              {paymentMethod === "SOL" ? "Hc6WiKs82cystWP2hVFzUJaBw1hebVX7sncCpL4ab1fR" : "btc-address-example"}
            </p>
            <p className="text-xs text-white/40">
              Expires in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}