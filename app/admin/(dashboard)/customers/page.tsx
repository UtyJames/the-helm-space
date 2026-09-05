"use client";

import { useEffect, useState, useTransition } from "react";

type Customer = {
  email: string;
  name: string;
  phone: string;
  totalBookings: number;
  onlineBookings: number;
  walkInBookings: number;
  totalSpend: number;
  lastBooking: string;
};

type LeaderboardEntry = Customer & { rank: number };

const N = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm" title="Rank 1">
        <i className="ti ti-trophy text-base" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-400/15 border border-slate-400/30 flex items-center justify-center text-slate-400 shadow-sm" title="Rank 2">
        <i className="ti ti-medal text-base" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-xl bg-amber-700/15 border border-amber-700/30 flex items-center justify-center text-amber-700 shadow-sm" title="Rank 3">
        <i className="ti ti-medal-2 text-base" />
      </div>
    );
  }
  return (
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white font-mono"
      style={{ background: "#141414" }}
    >
      {rank}
    </span>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState<"list" | "leaderboard">("list");
  const [, start] = useTransition();

  const load = (search = q, p = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (search) params.set("q", search);

    fetch(`/api/admin/customers?${params}`)
      .then(r => r.json())
      .then(d => {
        setCustomers(d.customers ?? []);
        setLeaderboard(d.leaderboard ?? []);
        setPages(d.pages ?? 1);
        setTotal(d.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load(q, page);
  }, [page]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(q, 1);
  };

  const exportCSV = () => {
    start(async () => {
      const res = await fetch("/api/admin/customers?take=99999");
      const d = await res.json();
      const rows = [
        ["Rank", "Customer Name", "Email", "Phone", "Total Bookings", "Online Bookings", "Walk-In Bookings", "Total Spend (NGN)", "Last Booking Date"],
        ...d.customers.map((c: Customer, idx: number) => [
          idx + 1,
          c.name,
          c.email,
          c.phone,
          c.totalBookings,
          c.onlineBookings ?? 0,
          c.walkInBookings ?? 0,
          c.totalSpend,
          fmt(c.lastBooking),
        ]),
      ];
      const csv = rows.map(r => r.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers-leaderboard-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>
            Management
          </p>
          <h1 className="text-2xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Customers & Leaderboard
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {total} unique customer{total !== 1 ? "s" : ""} across online & walk-in bookings
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-neutral-50 bg-white"
            style={{ borderColor: "#e5e5e5", color: "#141414" }}
          >
            <i className="ti ti-download text-sm" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border rounded-xl p-1 w-fit" style={{ borderColor: "#e5e5e5" }}>
        {([
          ["list", "Customer Directory", "ti-users"],
          ["leaderboard", "Top Spender Leaderboard", "ti-crown"],
        ] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all"
            style={{
              background: tab === key ? "#141414" : "transparent",
              color: tab === key ? "#fff" : "#777",
            }}
          >
            <i className={`ti ${icon} text-sm`} />
            {label}
          </button>
        ))}
      </div>

      {/* SEARCH BAR (For list view) */}
      {tab === "list" && (
        <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
          <div className="relative flex-1">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by customer name, email, phone…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none bg-white"
              style={{ borderColor: "#e5e5e5" }}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#141414]"
          >
            Search
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-20">
          <i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300" />
        </div>
      ) : tab === "list" ? (
        /* CUSTOMER DIRECTORY LIST */
        <>
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#ebebeb" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: "#f8f8f8" }}>
                  <tr>
                    {["Customer", "Email", "Phone", "Bookings Breakdown", "Total Spent", "Last Active"].map(h => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-sm text-neutral-400">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c, i) => (
                      <tr
                        key={c.email || c.phone || i}
                        className="border-t hover:bg-neutral-50/60 transition-colors"
                        style={{ borderColor: "#f0f0f0" }}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: "#f1552b" }}
                            >
                              {(c.name || "?")[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-[#141414]">{c.name || "Walk-In Guest"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-neutral-600 font-mono">{c.email || "—"}</td>
                        <td className="px-4 py-3.5 text-sm text-neutral-500 font-mono">{c.phone || "—"}</td>

                        {/* Breakdown */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#141414]">{c.totalBookings} total</span>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              {c.walkInBookings > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                                  <i className="ti ti-building text-xs text-purple-600" />
                                  {c.walkInBookings} walk-in
                                </span>
                              )}
                              {c.onlineBookings > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                  <i className="ti ti-world text-xs text-blue-600" />
                                  {c.onlineBookings} online
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono font-bold" style={{ color: "#f1552b" }}>
                          {N(c.totalSpend)}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-neutral-400 font-mono">{fmt(c.lastBooking)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => {
                  setPage(p => p - 1);
                }}
                disabled={page <= 1}
                className="px-3 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 transition-all hover:bg-neutral-50 bg-white"
                style={{ borderColor: "#e5e5e5" }}
              >
                <i className="ti ti-chevron-left" />
              </button>
              <span className="text-sm text-neutral-500 font-mono">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => {
                  setPage(p => p + 1);
                }}
                disabled={page >= pages}
                className="px-3 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 transition-all hover:bg-neutral-50 bg-white"
                style={{ borderColor: "#e5e5e5" }}
              >
                <i className="ti ti-chevron-right" />
              </button>
            </div>
          )}
        </>
      ) : (
        /* LEADERBOARD VIEW */
        <div className="space-y-3">
          <div
            className="rounded-2xl border p-6 mb-4 text-white shadow-sm"
            style={{
              borderColor: "#ebebeb",
              background: "linear-gradient(135deg, #141414 0%, #222222 100%)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <i className="ti ti-crown text-amber-400 text-lg" />
              <p className="text-white/60 text-[10px] font-mono tracking-widest uppercase">
                Top Client Spend Leaderboard
              </p>
            </div>
            <h2 className="text-white text-xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Highest Value Customers
            </h2>
            <p className="text-white/50 text-xs mt-1">
              Ranked dynamically by total revenue across all online reservations and walk-in physical bookings
            </p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center text-sm text-neutral-400">
              No customer booking data yet.
            </div>
          ) : (
            leaderboard.map(c => (
              <div
                key={c.email || c.phone || c.rank}
                className="bg-white rounded-2xl border overflow-hidden flex items-center gap-4 p-4 transition-all hover:shadow-md"
                style={{
                  borderColor: c.rank <= 3 ? "rgba(241,85,43,0.3)" : "#ebebeb",
                  boxShadow: c.rank === 1 ? "0 4px 16px rgba(241,85,43,0.12)" : "none",
                }}
              >
                <div className="flex items-center justify-center w-10 flex-shrink-0">
                  <RankBadge rank={c.rank} />
                </div>

                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                  style={{
                    background:
                      c.rank === 1
                        ? "#f1552b"
                        : c.rank === 2
                        ? "#4b5563"
                        : c.rank === 3
                        ? "#b45309"
                        : "#141414",
                  }}
                >
                  {(c.name || "?")[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#141414] text-sm truncate">{c.name}</p>
                    {c.rank === 1 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#f1552b] border border-orange-200">
                        <i className="ti ti-flame text-xs text-[#f1552b]" />
                        Top Spender
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 font-mono truncate">{c.email || c.phone}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-500">
                    <span className="font-medium">{c.totalBookings} total bookings</span>
                    {c.walkInBookings > 0 && (
                      <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                        <i className="ti ti-building text-xs text-purple-600" />
                        {c.walkInBookings} walk-in
                      </span>
                    )}
                    {c.onlineBookings > 0 && (
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        <i className="ti ti-world text-xs text-blue-600" />
                        {c.onlineBookings} online
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className="font-mono font-bold text-base"
                    style={{ color: c.rank === 1 ? "#f1552b" : "#141414" }}
                  >
                    {N(c.totalSpend)}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    Last active: {fmt(c.lastBooking)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
