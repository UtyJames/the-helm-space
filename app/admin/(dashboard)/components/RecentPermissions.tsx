"use client";

import { useState, useEffect, useTransition } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

type Permission = {
  id: string;
  dateFrom: string;
  dateTill: string;
  durationDays: number;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    username: string;
  };
};

export default function RecentPermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const load = () => {
    setLoading(true);
    fetch("/api/admin/permissions?page=1")
      .then(r => r.json())
      .then(d => {
        setPermissions(d.permissions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = (id: string, action: "approve" | "decline") => {
    setProcessingId(id);
    start(async () => {
      try {
        const res = await fetch("/api/admin/permissions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
        });
        if (res.ok) {
          toast.success(action === "approve" ? "Permission approved!" : "Permission declined.");
          load();
        } else {
          const d = await res.json();
          toast.error(d.error ?? "Action failed.");
        }
      } catch {
        toast.error("Network error.");
      } finally {
        setProcessingId(null);
      }
    });
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  const pendingList = permissions.filter(p => p.status === "PENDING").slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#ebebeb" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Recent Permissions
          </h3>
          {pendingList.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#f1552b" }}>
              {pendingList.length} Pending
            </span>
          )}
        </div>
        <Link
          href="/admin/permissions"
          className="text-xs font-semibold hover:underline flex items-center gap-1"
          style={{ color: "#f1552b" }}
        >
          View all <i className="ti ti-chevron-right text-[10px]" />
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <i className="ti ti-loader-2 animate-spin text-xl text-neutral-300" />
        </div>
      ) : permissions.length === 0 ? (
        <div className="py-8 text-center">
          <i className="ti ti-calendar-off text-3xl text-neutral-200 block mb-2" />
          <p className="text-xs text-neutral-400">No permission requests submitted.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {permissions.slice(0, 4).map(p => {
            const isProcessing = isPending && processingId === p.id;
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-neutral-50/50"
                style={{ borderColor: "#f0f0f0" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "#141414" }}
                  >
                    {(p.user.name ?? p.user.username)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[#141414]">{p.user.name ?? p.user.username}</p>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          p.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : p.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "DECLINED"
                            ? "bg-red-100 text-red-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-0.5 font-medium">{p.reason}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {fmt(p.dateFrom)} → {fmt(p.dateTill)} ({p.durationDays} day{p.durationDays !== 1 ? "s" : ""})
                    </p>
                  </div>
                </div>

                {/* Quick Approve / Decline buttons if pending */}
                {p.status === "PENDING" ? (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleAction(p.id, "approve")}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-1"
                    >
                      <i className="ti ti-check text-xs" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(p.id, "decline")}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-all flex items-center gap-1"
                    >
                      <i className="ti ti-x text-xs" /> Decline
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-neutral-400 font-mono self-end sm:self-center">
                    {fmt(p.createdAt)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
