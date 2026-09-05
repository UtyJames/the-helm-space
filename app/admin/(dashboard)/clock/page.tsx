"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

type Shift = { id: string; clockInAt: string; clockInLocation: string };

function ConfirmModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(241,85,43,0.1)" }}>
          <i className="ti ti-clock-off text-xl" style={{ color: "#f1552b" }}/>
        </div>
        <h3 className="text-base font-bold text-center text-[#141414] mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Confirm Clock Out
        </h3>
        <p className="text-sm text-neutral-500 text-center mb-6">
          Are you sure you want to clock out? Your shift time will be recorded.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-all"
            style={{ borderColor: "#e5e5e5" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "#f1552b" }}>
            {loading ? "Clocking out…" : "Yes, Clock Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClockPage() {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, start]            = useTransition();

  useEffect(() => {
    fetch("/api/admin/shifts")
      .then(r => r.json())
      .then(d => { setActiveShift(d.shift ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleClockIn = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }
    const toastId = toast.loading("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
        start(async () => {
          const res = await fetch("/api/admin/shifts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location: loc }),
          });
          const data = await res.json();
          toast.dismiss(toastId);
          if (res.ok) {
            setActiveShift(data.shift);
            toast.success("Clocked in successfully! Have a great shift.");
          } else {
            toast.error(data.error ?? "Failed to clock in.");
          }
        });
      },
      (err) => {
        toast.dismiss(toastId);
        toast.error(`Location error: ${err.message}. Please enable location access.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClockOut = () => {
    if (!navigator.geolocation) {
      doClockOut("");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => doClockOut(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`),
      () => doClockOut(""),
      { timeout: 5000 }
    );
  };

  const doClockOut = (loc: string) => {
    setShowConfirm(false);
    start(async () => {
      const res = await fetch(`/api/admin/shifts/${activeShift!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc }),
      });
      if (res.ok) {
        setActiveShift(null);
        toast.success("Clocked out. See you next time!");
      } else {
        toast.error("Failed to clock out. Try again.");
      }
    });
  };

  const clockedInTime = activeShift
    ? new Date(activeShift.clockInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  const elapsed = activeShift
    ? (() => {
        const diff = Date.now() - new Date(activeShift.clockInAt).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return `${h}h ${m}m`;
      })()
    : null;

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          onConfirm={() => handleClockOut()}
          onCancel={() => setShowConfirm(false)}
          loading={isPending}
        />
      )}

      <div className="p-6 md:p-8 max-w-lg">
        <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>Attendance</p>
        <h1 className="text-2xl font-bold text-[#141414] mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Clock In / Out
        </h1>

        {loading ? (
          <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: "#ebebeb" }}>
            <i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300"/>
          </div>
        ) : activeShift ? (
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#ebebeb" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100">
                <i className="ti ti-clock text-emerald-600 text-lg"/>
              </div>
              <div>
                <p className="font-semibold text-[#141414] text-sm">You're clocked in</p>
                <p className="text-xs text-neutral-400">Since {clockedInTime}</p>
              </div>
              <span className="ml-auto text-xs font-mono bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                {elapsed}
              </span>
            </div>

            <div className="bg-neutral-50 rounded-xl p-4 mb-5">
              <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Clock-in Location</p>
              <p className="text-xs text-neutral-600 font-mono">{activeShift.clockInLocation}</p>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={isPending}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "#f1552b" }}
            >
              {isPending ? "Processing…" : "Clock Out"}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#ebebeb" }}>
            <div className="text-center py-4 mb-5">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(241,85,43,0.08)" }}>
                <i className="ti ti-clock text-3xl" style={{ color: "#f1552b" }}/>
              </div>
              <p className="font-semibold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Not clocked in</p>
              <p className="text-sm text-neutral-400 mt-1">Click below to start your shift. Your location will be recorded.</p>
            </div>

            <button
              onClick={handleClockIn}
              disabled={isPending}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "#141414" }}
            >
              {isPending ? "Clocking in…" : "Clock In"}
            </button>
            <p className="text-center text-xs text-neutral-400 mt-3">
              <i className="ti ti-map-pin"/> Your GPS location will be captured at clock-in.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
