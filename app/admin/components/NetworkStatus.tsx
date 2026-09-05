"use client";

import { useEffect, useState } from "react";

export default function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleOffline = () => { setOnline(false); setShow(true); };
    const handleOnline  = () => {
      setOnline(true);
      setTimeout(() => setShow(false), 2500);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (!navigator.onLine) { setOnline(false); setShow(true); }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online",  handleOnline);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 text-[12px] font-medium transition-all"
      style={{
        background: online ? "#10b981" : "#ef4444",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <span className={`w-2 h-2 rounded-full ${online ? "bg-white" : "bg-white/60 animate-pulse"}`}/>
      {online
        ? "✓ Back online — everything is working."
        : "⚠ No internet connection — some features may be unavailable."}
    </div>
  );
}
