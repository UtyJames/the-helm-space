"use client";

import { useState, useMemo, useTransition } from "react";
import toast, { Toaster } from "react-hot-toast";

type PackageId = "monthly-standard" | "monthly-premium" | "weekend" | "team-desks" | "meeting-room" | "hall" | "daily-dedicated" | "daily-shared" | "custom";

const PKGS = [
  { id: "monthly-standard", key: "monthly-standard", label: "The Helm Monthly Package", sublabel: null, price: 70000, orig: 75000, unit: "/month", custom: false },
  { id: "monthly-premium",  key: "monthly-premium",  label: "The Helm Monthly Package", sublabel: "Premium", price: 80000, orig: 85000, unit: "/month", custom: false },
  { id: "weekend",          key: "weekend",          label: "The Helm Weekend Package", sublabel: null, price: 12000, orig: null, unit: "/weekend", custom: false },
  { id: "team-desks",       key: "team-desks",       label: "Team Desks", sublabel: "Shared Desk - team of 4", price: 11000, orig: 12500, unit: "/month", custom: false },
  { id: "meeting-room",     key: "meeting-room",     label: "Meeting Room", sublabel: "9 seats", price: 15000, orig: 25000, unit: "/session", custom: false },
  { id: "hall",             key: "hall",             label: "The Helm Space Hall", sublabel: "For Rent", price: 80000, orig: 100000, unit: "/day", custom: false },
  { id: "daily-dedicated",  key: "daily-dedicated",  label: "Daily Pass", sublabel: "Dedicated Desk", price: 2000, orig: 4000, unit: "/day", custom: false },
  { id: "daily-shared",     key: "daily-shared",     label: "Daily Pass", sublabel: "Shared Table", price: 1500, orig: 3500, unit: "/day", custom: false },
  { id: "custom",           key: "custom",           label: "Custom Date Pass", sublabel: "Shared Table - pick your days", price: 1500, orig: null, unit: "/day", custom: true },
];

const N = (n: number) => "₦" + n.toLocaleString("en-NG");

function Calendar({ sel, onToggle }: { sel: Set<string>; onToggle: (k: string) => void }) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const key   = (d: number) => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const past  = (d: number) => d < now.getDate();
  const days  = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({length:total},(_,i)=>i+1)];
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map(d => <div key={d} className="text-center text-[11px] font-medium text-neutral-400 py-0.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d,i) => {
          if (!d) return <div key={i}/>;
          const k=key(d), p=past(d), s=sel.has(k);
          return (
            <button key={k} onClick={()=>!p&&onToggle(k)} disabled={p}
              className={["h-9 w-full rounded-lg text-[13px] font-medium transition-all",
                p?"text-neutral-300 cursor-not-allowed":"cursor-pointer",
                s?"text-white shadow-sm":p?"":"hover:text-ink"].join(" ")}
              style={s?{background:"#f1552b"}:{}}>
              {d}
            </button>
          );
        })}
      </div>
      {sel.size>0&&<p className="mt-3 text-xs text-neutral-500"><span className="font-semibold" style={{color:"#f1552b"}}>{sel.size}</span> {sel.size===1?"day":"days"} · {N(sel.size*1500)}</p>}
    </div>
  );
}

type Step = 1 | 2 | 3;

export default function BookPage() {
  const [step, setStep] = useState<Step>(1);
  const [picked, setPicked] = useState<PackageId | null>(null);
  const [dates,  setDates]  = useState<Set<string>>(new Set());
  const [form,   setForm]   = useState({ name: "", email: "", phone: "" });
  const [isPending, start]  = useTransition();

  const pkg   = PKGS.find(p => p.id === picked);
  const total = useMemo(() => !pkg ? 0 : pkg.custom ? dates.size * 1500 : pkg.price, [pkg, dates]);

  const toggle = (k: string) => setDates(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const canProceedStep1 = pkg && (!pkg.custom || dates.size > 0);
  const canProceedStep2 = form.name.trim() && form.email.trim() && form.phone.trim();

  const handlePay = () => {
    if (!pkg || !form.email || !form.name || !form.phone) return;

    start(async () => {
      const toastId = toast.loading("Preparing your booking…");
      try {
        const res = await fetch("/api/bookings/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packageId: pkg.id,
            dates: pkg.custom ? Array.from(dates) : null,
            amount: total,
            customerName: form.name,
            email: form.email,
            phone: form.phone,
          }),
        });

        const data = await res.json();
        toast.dismiss(toastId);

        if (!res.ok) {
          toast.error(data.error ?? "Booking failed. Please try again.");
          return;
        }

        toast.success("Booking created! Redirecting to payment…");
        setTimeout(() => { window.location.href = data.authorizationUrl; }, 800);
      } catch {
        toast.dismiss(toastId);
        toast.error("Network error. Please check your connection.");
      }
    });
  };

  return (
    <main className="min-h-screen font-body" style={{ backgroundColor: "#faf9f7" }}>
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Inter, sans-serif", fontSize: 13 } }}/>

      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-14 pb-10">
        <p className="text-[10px] font-mono tracking-[0.08em] uppercase mb-3" style={{ color: "#f1552b" }}>Confirm your booking</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink leading-tight max-w-lg">
          {step === 1 ? "Choose your space package." : step === 2 ? "Your details." : "Review & pay."}
        </h1>
        <p className="mt-3 text-sm text-neutral-500 max-w-md leading-relaxed">
          {step === 1 ? "Select a plan, pick your dates if needed, then pay securely."
           : step === 2 ? "Tell us who you are so we can confirm your booking."
           : "Review your order and complete payment via Paystack."}
        </p>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mt-5 mb-8">
          {[1,2,3].map((s,i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{ background: step >= s ? "#f1552b" : "#e5e5e5", color: step >= s ? "white" : "#aaa" }}>
                {s}
              </div>
              {i < 2 && <div className="w-8 h-0.5 rounded-full" style={{ background: step > s ? "#f1552b" : "#e5e5e5" }}/>}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 pb-24 grid lg:grid-cols-[1fr_380px] gap-8 items-start">

        {/* Left — Step content */}
        <div>
          {/* STEP 1 — Package selection */}
          {step === 1 && (
            <div className="space-y-3">
              {PKGS.map(p => {
                const on = picked === p.id;
                return (
                  <button key={p.id}
                    onClick={() => { setPicked(on ? null : p.id as PackageId); if (!p.custom) setDates(new Set()); }}
                    className={["w-full text-left rounded-2xl border p-5 transition-all duration-200 cursor-pointer",
                      on ? "border-[#f1552b] bg-white shadow-md" : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"].join(" ")}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className={["mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          on?"border-[#f1552b]":"border-neutral-300"].join(" ")}>
                          {on&&<span className="w-2 h-2 rounded-full" style={{background:"#f1552b"}}/>}
                        </span>
                        <div>
                          <p className="font-display font-semibold text-[15px] text-ink">{p.label}</p>
                          {p.sublabel&&<p className="text-xs text-neutral-400 mt-0.5">{p.sublabel}</p>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-display font-bold text-[18px] text-ink">{p.custom?"₦1,500":N(p.price)}</p>
                        {p.orig&&<p className="text-xs text-neutral-400 line-through">{N(p.orig)}</p>}
                        <p className="text-[10px] text-neutral-400 font-mono">{p.custom?"/day - pick dates":p.unit}</p>
                      </div>
                    </div>
                    {on&&p.custom&&(
                      <div className="mt-4 pt-4 border-t border-neutral-100" onClick={e=>e.stopPropagation()}>
                        <Calendar sel={dates} onToggle={toggle}/>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2 — Customer details */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
              {[
                { key: "name", label: "Full Name", placeholder: "e.g. Adaeze Okonkwo", type: "text" },
                { key: "email", label: "Email Address", placeholder: "e.g. adaeze@example.com", type: "email" },
                { key: "phone", label: "Phone Number", placeholder: "e.g. 08012345678", type: "tel" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-ink placeholder-neutral-400 focus:outline-none transition-all"
                    onFocus={e => e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.25)"}
                    onBlur={e => e.target.style.boxShadow = "none"}
                  />
                </div>
              ))}
              <button onClick={() => setStep(1)} className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1 mt-2">
                ← Back to package selection
              </button>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && pkg && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
              <div>
                <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-3">Booking Summary</p>
                <div className="space-y-2">
                  {[
                    { label: "Package", value: `${pkg.label}${pkg.sublabel ? ` (${pkg.sublabel})` : ""}` },
                    { label: "Name", value: form.name },
                    { label: "Email", value: form.email },
                    { label: "Phone", value: form.phone },
                    ...(pkg.custom && dates.size > 0 ? [{ label: "Days", value: `${dates.size} day${dates.size > 1 ? "s" : ""}` }] : []),
                    { label: "Amount", value: N(total), bold: true },
                  ].map(({ label, value, bold }) => (
                    <div key={label} className="flex justify-between py-2 border-b" style={{ borderColor: "#f5f5f5" }}>
                      <span className="text-xs text-neutral-500">{label}</span>
                      <span className={`text-sm ${bold ? "font-bold" : "font-medium"} text-ink`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(2)} className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1">
                ← Edit details
              </button>
            </div>
          )}
        </div>

        {/* Right — Sticky summary + CTA */}
        <div className="lg:sticky lg:top-8 space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 mb-5">Order Summary</p>
            {pkg ? (
              <div className="space-y-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-sm text-ink">{pkg.label}</p>
                    {pkg.sublabel&&<p className="text-xs text-neutral-400 mt-0.5">{pkg.sublabel}</p>}
                    {pkg.custom&&dates.size>0&&<p className="text-xs mt-1" style={{color:"#f1552b"}}>{dates.size} day{dates.size!==1?"s":""} selected</p>}
                    {pkg.custom&&dates.size===0&&<p className="text-xs text-neutral-400 mt-1">No dates selected</p>}
                  </div>
                  <p className="font-display font-semibold text-sm text-ink whitespace-nowrap">
                    {pkg.custom?`${dates.size} x ₦1,500`:N(pkg.price)}
                  </p>
                </div>
                <hr className="border-neutral-100"/>
                <div className="space-y-2">
                  {["100% backup power","Fast fiber internet","Quiet call rooms","Premium access"].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="7" fill="#f1552b" fillOpacity="0.12"/>
                        <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="#f1552b" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      <span className="text-xs text-neutral-500">{i}</span>
                    </div>
                  ))}
                </div>
                <hr className="border-neutral-100"/>
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Total</p>
                  <p className="font-display font-bold text-2xl text-ink">{N(total)}</p>
                  {pkg.orig&&!pkg.custom&&<p className="text-xs mt-1" style={{color:"#f1552b"}}>You save {N(pkg.orig-pkg.price)}</p>}
                </div>

                {/* Step CTAs */}
                {step === 1 && (
                  <button disabled={!canProceedStep1}
                    onClick={() => canProceedStep1 && setStep(2)}
                    className={["w-full py-3.5 rounded-full font-display font-semibold text-sm transition-all",
                      !canProceedStep1?"bg-neutral-200 text-neutral-400 cursor-not-allowed":"text-white hover:opacity-90 shadow-sm"].join(" ")}
                    style={canProceedStep1?{background:"#141414"}:{}}>
                    {pkg.custom&&dates.size===0?"Select dates to continue":"Continue →"}
                  </button>
                )}
                {step === 2 && (
                  <button disabled={!canProceedStep2}
                    onClick={() => canProceedStep2 && setStep(3)}
                    className={["w-full py-3.5 rounded-full font-display font-semibold text-sm transition-all",
                      !canProceedStep2?"bg-neutral-200 text-neutral-400 cursor-not-allowed":"text-white hover:opacity-90 shadow-sm"].join(" ")}
                    style={canProceedStep2?{background:"#141414"}:{}}>
                    Review Booking →
                  </button>
                )}
                {step === 3 && (
                  <button onClick={handlePay} disabled={isPending}
                    className="w-full py-3.5 rounded-full font-display font-semibold text-sm text-white transition-all shadow-sm hover:opacity-90"
                    style={{ background: "#f1552b" }}>
                    {isPending ? "Processing…" : `Pay ${N(total)} via Paystack`}
                  </button>
                )}
                <p className="text-center text-[11px] text-neutral-400">
                  {step === 3 ? "You'll be redirected to Paystack's secure checkout." : "Secure checkout · No hidden fees"}
                </p>
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{background:"rgba(241,85,43,0.10)"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#f1552b" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="font-display font-semibold text-sm text-ink">No package selected</p>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed max-w-[160px] mx-auto">Pick a plan on the left to see your total.</p>
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-400 text-center">Need help? <a href="/contact" className="no-underline hover:underline" style={{color:"#f1552b"}}>Talk to us</a></p>
        </div>
      </div>
    </main>
  );
}