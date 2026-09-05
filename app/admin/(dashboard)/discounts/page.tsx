"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

type DiscountRequest = {
  id: string; bookingRef?: string; customerName: string; amountOff: number; reason: string;
  status: string; createdAt: string;
  requestedBy: { name?: string; username: string };
};

const N = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function DiscountsPage() {
  const [requests, setRequests] = useState<DiscountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [isPending, start] = useTransition();

  const load = (status = filter) => {
    setLoading(true);
    fetch(`/api/admin/discounts?status=${status}`)
      .then(r => r.json())
      .then(d => { setRequests(d.requests ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleDecide = (id: string, decision: "APPROVED" | "REJECTED") => {
    start(async () => {
      const res = await fetch("/api/admin/discounts", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: decision }),
      });
      if (res.ok) { toast.success(`Request ${decision.toLowerCase()}!`); load(); }
      else toast.error("Action failed.");
    });
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-600",
  };

  return (
    <div className="p-6 md:p-8">
      <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>Management</p>
      <h1 className="text-2xl font-bold text-[#141414] mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Discount Requests</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {["PENDING","APPROVED","REJECTED"].map(s => (
          <button key={s} onClick={() => { setFilter(s); load(s); }}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === s ? "#141414" : "white",
              color: filter === s ? "white" : "#888",
              border: "1px solid",
              borderColor: filter === s ? "#141414" : "#e5e5e5",
            }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20"><i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300"/></div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#ebebeb" }}>
          <i className="ti ti-discount-off text-4xl text-neutral-200 block mb-3"/>
          <p className="text-sm text-neutral-400">No {filter.toLowerCase()} discount requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#ebebeb" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[#141414] text-sm">{r.customerName}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  </div>
                  {r.bookingRef && <p className="text-xs font-mono text-neutral-400 mb-1">Booking: {r.bookingRef}</p>}
                  <p className="text-xs text-neutral-500 mb-2 leading-relaxed">"{r.reason}"</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold" style={{ color: "#f1552b" }}>Discount: {N(r.amountOff)}</span>
                    <span className="text-xs text-neutral-400">
                      by {r.requestedBy.name ?? r.requestedBy.username} · {new Date(r.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short" })}
                    </span>
                  </div>
                </div>

                {r.status === "PENDING" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleDecide(r.id, "APPROVED")} disabled={isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#10b981" }}>
                      Approve
                    </button>
                    <button onClick={() => handleDecide(r.id, "REJECTED")} disabled={isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#ef4444" }}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
