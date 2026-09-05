"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

type Permission = {
  id: string;
  dateFrom: string;
  dateTill: string;
  durationDays: number;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  cancelledAt?: string;
  approvedAt?: string;
  user: { id: string; name?: string; username: string; email?: string };
  approvedBy?: { name?: string; username: string };
};

const REASONS = [
  "Personal Emergency",
  "Medical Leave",
  "Family Emergency",
  "Study Leave / Exam",
  "Annual Leave",
  "Bereavement Leave",
  "Other",
];

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED:  "bg-emerald-100 text-emerald-800 border-emerald-200",
  DECLINED:  "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const STATUS_ICONS: Record<string, string> = {
  PENDING:   "ti-clock",
  APPROVED:  "ti-check",
  DECLINED:  "ti-x",
  CANCELLED: "ti-ban",
};

export default function PermissionsPage() {
  const [tab, setTab] = useState<"manage" | "my" | "new">("my");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Permission | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, start] = useTransition();

  // Form state
  const [form, setForm] = useState({ dateFrom: "", dateTill: "", reason: "", details: "" });
  const [duration, setDuration] = useState<number | null>(null);

  // Check auth / role
  useEffect(() => {
    fetch("/api/admin/staff")
      .then(r => {
        if (r.ok) {
          setIsSuperAdmin(true);
          setTab("manage");
        }
      })
      .catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/permissions")
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

  useEffect(() => {
    if (form.dateFrom && form.dateTill) {
      const from = new Date(form.dateFrom);
      const till = new Date(form.dateTill);
      if (till > from) {
        setDuration(Math.ceil((till.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        setDuration(null);
      }
    } else {
      setDuration(null);
    }
  }, [form.dateFrom, form.dateTill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dateFrom || !form.dateTill || !form.reason || !form.details) {
      toast.error("All fields are required.");
      return;
    }
    if (!duration || duration <= 0) {
      toast.error("End date must be after start date.");
      return;
    }

    start(async () => {
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Permission request submitted!");
        setForm({ dateFrom: "", dateTill: "", reason: "", details: "" });
        setTab("my");
        load();
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Submission failed.");
      }
    });
  };

  const handleAction = (id: string, action: "approve" | "decline" | "cancel") => {
    start(async () => {
      const res = await fetch("/api/admin/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        if (action === "approve") toast.success("Permission approved & email sent!");
        else if (action === "decline") toast.success("Permission declined & email sent.");
        else toast.success("Permission cancelled.");
        load();
        if (detail && detail.id === id) setDetail(null);
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Action failed.");
      }
    });
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const filteredPermissions = permissions.filter(p => {
    if (statusFilter === "ALL") return true;
    return p.status === statusFilter;
  });

  const pendingCount = permissions.filter(p => p.status === "PENDING").length;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>
          Leave & Absence Management
        </p>
        <h1 className="text-2xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Permissions
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Request and review staff time-off. All leave requests require Super Admin approval.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-white border rounded-xl p-1 mb-6 w-fit" style={{ borderColor: "#e5e5e5" }}>
        {isSuperAdmin && (
          <button
            onClick={() => setTab("manage")}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all relative"
            style={{
              background: tab === "manage" ? "#141414" : "transparent",
              color: tab === "manage" ? "#fff" : "#777",
            }}
          >
            <i className="ti ti-checklist text-sm" />
            <span>All Staff Requests</span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white bg-[#f1552b]">
                {pendingCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setTab("my")}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all"
          style={{
            background: tab === "my" ? "#141414" : "transparent",
            color: tab === "my" ? "#fff" : "#777",
          }}
        >
          <i className="ti ti-user text-sm" />
          <span>My Requests</span>
        </button>

        <button
          onClick={() => setTab("new")}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all"
          style={{
            background: tab === "new" ? "#141414" : "transparent",
            color: tab === "new" ? "#fff" : "#777",
          }}
        >
          <i className="ti ti-plus text-sm" />
          <span>New Request</span>
        </button>
      </div>

      {/* SUPER ADMIN: Manage All Requests Tab */}
      {tab === "manage" && isSuperAdmin && (
        <div className="space-y-4">
          {/* Status filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {["ALL", "PENDING", "APPROVED", "DECLINED", "CANCELLED"].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  statusFilter === st
                    ? "bg-[#141414] text-white border-[#141414]"
                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {st === "ALL" ? "All Requests" : st}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300" />
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#ebebeb" }}>
              <i className="ti ti-calendar-off text-4xl text-neutral-200 block mb-3" />
              <p className="text-sm text-neutral-400">No permission requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPermissions.map(p => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border p-5 transition-all hover:border-neutral-300"
                  style={{ borderColor: "#ebebeb" }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: "#141414" }}
                      >
                        {(p.user.name ?? p.user.username)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="font-semibold text-[#141414] text-sm">
                            {p.user.name ?? p.user.username}
                          </p>
                          <span className="text-xs text-neutral-400 font-mono">
                            @{p.user.username}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              STATUS_STYLES[p.status] ?? "bg-neutral-100"
                            }`}
                          >
                            <i className={`ti ${STATUS_ICONS[p.status]} text-xs`} />
                            {p.status}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-[#141414] mt-1">{p.reason}</p>

                        <div className="flex items-center gap-4 text-xs text-neutral-500 mt-1 flex-wrap">
                          <span>
                            <i className="ti ti-calendar mr-1" />
                            {fmt(p.dateFrom)} → {fmt(p.dateTill)}
                          </span>
                          <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">
                            {p.durationDays} day{p.durationDays !== 1 ? "s" : ""}
                          </span>
                          <span className="text-neutral-400">Submitted {fmt(p.createdAt)}</span>
                        </div>

                        <p className="text-xs text-neutral-600 mt-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                          {p.details}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                      <button
                        onClick={() => setDetail(p)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border text-neutral-600 hover:bg-neutral-50 transition-colors"
                        style={{ borderColor: "#e5e5e5" }}
                      >
                        Details
                      </button>

                      {p.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleAction(p.id, "approve")}
                            disabled={isPending}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <i className="ti ti-check" /> Approve
                          </button>
                          <button
                            onClick={() => handleAction(p.id, "decline")}
                            disabled={isPending}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-all flex items-center gap-1.5"
                          >
                            <i className="ti ti-x" /> Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY REQUESTS TAB */}
      {tab === "my" && (
        loading ? (
          <div className="text-center py-16">
            <i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300" />
          </div>
        ) : permissions.length === 0 ? (
          <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#ebebeb" }}>
            <i className="ti ti-calendar-off text-4xl text-neutral-200 block mb-3" />
            <p className="text-sm text-neutral-400">No permission requests yet.</p>
            <button
              onClick={() => setTab("new")}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#f1552b" }}
            >
              Submit a Request
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {permissions.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#ebebeb" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                          STATUS_STYLES[p.status]
                        }`}
                      >
                        <i className={`ti ${STATUS_ICONS[p.status]} text-xs`} />
                        {p.status}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">Submitted {fmt(p.createdAt)}</span>
                    </div>
                    <p className="font-semibold text-[#141414] text-sm">{p.reason}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      <i className="ti ti-calendar mr-1" />
                      {fmt(p.dateFrom)} → {fmt(p.dateTill)}
                      <span className="ml-2 font-mono">({p.durationDays} day{p.durationDays !== 1 ? "s" : ""})</span>
                    </p>
                    {p.status === "APPROVED" && p.approvedBy && (
                      <p className="text-xs text-emerald-600 mt-1">
                        <i className="ti ti-check mr-1" />
                        Approved by {p.approvedBy.name ?? p.approvedBy.username}
                      </p>
                    )}
                    {p.status === "DECLINED" && (
                      <p className="text-xs text-red-500 mt-1">
                        <i className="ti ti-x mr-1" />
                        Declined by management
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{p.details}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setDetail(p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:bg-neutral-50"
                      style={{ borderColor: "#e5e5e5", color: "#555" }}
                    >
                      View Details
                    </button>
                    {p.status === "PENDING" && (
                      <button
                        onClick={() => handleAction(p.id, "cancel")}
                        disabled={isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-100 hover:bg-red-50 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* NEW REQUEST TAB */}
      {tab === "new" && (
        <div className="max-w-xl">
          {/* Disclaimer */}
          <div
            className="mb-6 p-4 rounded-2xl border"
            style={{ background: "rgba(241,85,43,0.05)", borderColor: "rgba(241,85,43,0.2)" }}
          >
            <div className="flex items-start gap-3">
              <i className="ti ti-alert-triangle text-[#f1552b] text-lg flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#141414] mb-1">Important Notice</p>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Permission requests are subject to approval by the Super Admin. A permission is{" "}
                  <strong>inadmissible</strong> until explicitly approved. An automated email will be sent upon
                  decision.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                  Date From *
                </label>
                <input
                  type="date"
                  value={form.dateFrom}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none bg-white"
                  style={{ borderColor: "#e5e5e5" }}
                  onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                  onBlur={e => (e.target.style.boxShadow = "none")}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                  Date Till *
                </label>
                <input
                  type="date"
                  value={form.dateTill}
                  min={form.dateFrom || new Date().toISOString().split("T")[0]}
                  onChange={e => setForm(f => ({ ...f, dateTill: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none bg-white"
                  style={{ borderColor: "#e5e5e5" }}
                  onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                  onBlur={e => (e.target.style.boxShadow = "none")}
                />
              </div>
            </div>

            {/* Duration badge */}
            {duration && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <i className="ti ti-clock text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">
                  Duration:{" "}
                  <span className="font-mono">
                    {duration} day{duration !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                Reason *
              </label>
              <select
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none bg-white"
                style={{ borderColor: "#e5e5e5" }}
                onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                onBlur={e => (e.target.style.boxShadow = "none")}
              >
                <option value="">Select a reason…</option>
                {REASONS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                Additional Details *
              </label>
              <textarea
                value={form.details}
                onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                rows={4}
                placeholder="Provide all relevant details about your request. This will be reviewed by the Super Admin."
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none resize-none"
                style={{ borderColor: "#e5e5e5" }}
                onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                onBlur={e => (e.target.style.boxShadow = "none")}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: isPending ? "#888" : "#141414" }}
            >
              {isPending ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-send" />}
              {isPending ? "Submitting…" : "Submit Permission Request"}
            </button>
          </form>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Permission Details
              </h3>
              <button
                onClick={() => setDetail(null)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"
              >
                <i className="ti ti-x text-neutral-500" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Staff Member",
                  value: `${detail.user.name ?? detail.user.username} (@${detail.user.username})`,
                },
                {
                  label: "Status",
                  value: (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[detail.status]}`}>
                      {detail.status}
                    </span>
                  ),
                },
                { label: "Date From", value: fmt(detail.dateFrom) },
                { label: "Date Till", value: fmt(detail.dateTill) },
                {
                  label: "Duration",
                  value: `${detail.durationDays} day${detail.durationDays !== 1 ? "s" : ""}`,
                },
                { label: "Reason", value: detail.reason },
                { label: "Details", value: detail.details },
                { label: "Submitted", value: fmt(detail.createdAt) },
                ...(detail.approvedBy
                  ? [
                      {
                        label: "Reviewed By",
                        value: detail.approvedBy.name ?? detail.approvedBy.username,
                      },
                    ]
                  : []),
              ].map(({ label, value }) => (
                <div key={label} className="bg-neutral-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
                  <div className="text-sm text-[#141414]">{value}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions inside modal if Super Admin and pending */}
            {isSuperAdmin && detail.status === "PENDING" && (
              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => handleAction(detail.id, "approve")}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
                >
                  <i className="ti ti-check" /> Approve Request
                </button>
                <button
                  onClick={() => handleAction(detail.id, "decline")}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-all flex items-center justify-center gap-1"
                >
                  <i className="ti ti-x" /> Decline Request
                </button>
              </div>
            )}

            <button
              onClick={() => setDetail(null)}
              className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 border"
              style={{ borderColor: "#e5e5e5" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
