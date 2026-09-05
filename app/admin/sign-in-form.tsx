"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { adminSignIn } from "./actions";
import toast, { Toaster } from "react-hot-toast";

type Mode = "credentials" | "pin";

const MAX_ATTEMPTS = 4;
const LOCKOUT_MINUTES = 30;

export default function AdminSignInForm() {
  const [mode, setMode] = useState<Mode>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState("");
  const [isPending, startTransition] = useTransition();

  // PIN lockout state
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown ticker
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setLockedUntil(null);
        setPinAttempts(0);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lockedUntil]);

  const isLocked = !!lockedUntil && countdown > 0;
  const attemptsLeft = MAX_ATTEMPTS - pinAttempts;

  const handlePinKey = (key: string) => {
    if (isLocked) return;
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < 4) {
      setPin((p) => p + key);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "credentials") {
      if (!username.trim()) { toast.error("Please enter your username."); return; }
      if (!password) { toast.error("Please enter your password."); return; }
    }

    if (mode === "pin") {
      if (isLocked) { toast.error(`Locked. Try again in ${Math.ceil(countdown / 60)}m ${countdown % 60}s.`); return; }
      if (pin.length !== 4) { toast.error("Please enter your 4-digit PIN."); return; }
    }

    const fd = new FormData();
    if (mode === "credentials") {
      fd.set("username", username.trim());
      fd.set("password", password);
    } else {
      fd.set("pin", pin);
    }
    fd.set("mode", mode);

    startTransition(async () => {
      const result = await adminSignIn(fd);
      if (result?.success === false) {
        if (mode === "pin") {
          const newAttempts = pinAttempts + 1;
          setPinAttempts(newAttempts);
          setPin("");

          if (newAttempts >= MAX_ATTEMPTS) {
            const lockExpiry = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
            setLockedUntil(lockExpiry);
            toast.error(`Too many attempts. Locked for ${LOCKOUT_MINUTES} minutes.`);
          } else {
            const remaining = MAX_ATTEMPTS - newAttempts;
            if (newAttempts === 1) {
              toast.error(`Incorrect PIN. ⚠️ You have ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining. After ${MAX_ATTEMPTS} failed attempts, a ${LOCKOUT_MINUTES}-minute lockout will begin.`);
            } else {
              toast.error(`Incorrect PIN. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
            }
          }
        } else {
          toast.error(result.message);
        }
      }
    });
  };

  const pinKeys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2,"0")}:${(s % 60).toString().padStart(2,"0")}`;

  return (
    <div className="min-h-screen flex bg-[#faf9f7]">
      <Toaster position="top-center" toastOptions={{
        style: { fontFamily: "Inter, sans-serif", fontSize: 13 },
        success: { iconTheme: { primary: "#f1552b", secondary: "#fff" } },
      }}/>

      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10"
        style={{ background: "#141414" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden p-0.5" style={{ background: "#ffffff" }}>
            <img src="/THS-FAVICON.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-bold text-[15px] tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            The Helm Space
          </span>
        </div>

        {/* Center quote */}
        <div>
          <p className="text-white/20 text-[11px] font-mono tracking-widest uppercase mb-6">Staff Portal</p>
          <h2 className="text-white text-3xl font-bold leading-tight mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Your workspace,<br />your dashboard.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Clock in, manage bookings, track tasks — all from one place. Built for the team that keeps The Helm running.
          </p>
        </div>

        {/* Bottom status */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/40 text-xs">System online</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden p-0.5 border border-neutral-200" style={{ background: "#ffffff" }}>
              <img src="/THS-FAVICON.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-sm text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>The Helm Space</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-[10px] font-mono tracking-[0.1em] uppercase mb-2" style={{ color: "#f1552b" }}>Admin Access</p>
            <h1 className="text-2xl font-bold text-[#141414] leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Sign in to continue
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {mode === "credentials" ? "Use your username and password." : "Enter your 4-digit PIN to sign in."}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl border border-neutral-200 bg-white p-1 mb-7 gap-1">
            {(["credentials", "pin"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setPin(""); setPassword(""); }}
                className="flex-1 py-2 rounded-[10px] text-[12px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
                style={{
                  background: mode === m ? "#141414" : "transparent",
                  color: mode === m ? "#fff" : "#888",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <i className={`ti ${m === "credentials" ? "ti-lock" : "ti-keypad"} text-sm`} />
                {m === "credentials" ? "Password" : "PIN"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Credentials mode — username + password */}
            {mode === "credentials" && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. frontdesk"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-[#141414] placeholder-neutral-400 focus:outline-none transition-all"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.25)"}
                    onBlur={(e) => e.target.style.boxShadow = "none"}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-11 text-sm text-[#141414] placeholder-neutral-400 focus:outline-none transition-all"
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.25)"}
                      onBlur={(e) => e.target.style.boxShadow = "none"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* PIN mode — dot display + keypad (no username) */}
            {mode === "pin" && (
              <div>
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-3">
                  4-Digit PIN
                </label>

                {/* Lockout banner */}
                {isLocked && (
                  <div className="mb-4 p-3 rounded-xl text-sm font-medium text-center" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <i className="ti ti-lock mr-1.5" />
                    Account locked. Try again in <span className="font-mono font-bold">{fmt(countdown)}</span>
                  </div>
                )}

                {/* Attempts warning */}
                {!isLocked && pinAttempts > 0 && (
                  <div className="mb-3 p-2.5 rounded-xl text-xs" style={{ background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <i className="ti ti-alert-triangle mr-1" />
                    {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining before {LOCKOUT_MINUTES}-min lockout.
                  </div>
                )}

                {/* First-time hint */}
                {!isLocked && pinAttempts === 0 && (
                  <div className="mb-3 p-2.5 rounded-xl text-xs" style={{ background: "rgba(20,20,20,0.05)", color: "#888" }}>
                    <i className="ti ti-info-circle mr-1" />
                    After {MAX_ATTEMPTS} failed attempts, a {LOCKOUT_MINUTES}-minute lockout will begin.
                  </div>
                )}

                {/* PIN dots */}
                <div className="flex items-center justify-center gap-4 mb-5">
                  {[0,1,2,3].map((i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full transition-all duration-200"
                      style={{ background: pin.length > i ? "#f1552b" : "#e5e5e5" }}
                    />
                  ))}
                </div>
                {/* Keypad */}
                <div className={`grid grid-cols-3 gap-2 ${isLocked ? "opacity-40 pointer-events-none" : ""}`}>
                  {pinKeys.map((key, i) => (
                    key === "" ? (
                      <div key={i} />
                    ) : (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handlePinKey(key)}
                        className="h-14 rounded-xl text-lg font-semibold transition-all duration-100 select-none active:scale-95"
                        style={{
                          background: key === "⌫" ? "#fce9e2" : "white",
                          color: key === "⌫" ? "#f1552b" : "#141414",
                          border: "1px solid #e5e5e5",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {key}
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || isLocked}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-2"
              style={{
                background: (isPending || isLocked) ? "#888" : "#141414",
                fontFamily: "Inter, sans-serif",
                cursor: (isPending || isLocked) ? "not-allowed" : "pointer",
              }}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : isLocked ? `Locked — ${fmt(countdown)}` : "Sign In →"}
            </button>
          </form>

          <p className="text-center text-xs text-neutral-400 mt-8">
            Don't have access? Contact the manager.
          </p>
        </div>
      </div>
    </div>
  );
}
