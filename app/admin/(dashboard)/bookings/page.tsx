"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

type Package = {
  id: string;
  label: string;
  sublabel?: string;
  price: number;
  unit: string;
};

type Booking = {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  status: string;
  amount: number;
  bookingType: string; // "ONLINE" | "PHYSICAL"
  paymentMethod?: string; // "CASH" | "POS" | "TRANSFER"
  amountPaid?: number;
  changeGiven?: number;
  notes?: string;
  createdAt: string;
  checkedInAt?: string;
  package: { label: string; sublabel?: string };
  checkedInBy?: { name?: string; username: string };
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-blue-100 text-blue-700",
  CHECKED_IN: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
  CANCELLED: "bg-red-100 text-red-600",
  FAILED: "bg-red-100 text-red-600",
};

const N = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "" | "ONLINE" | "PHYSICAL"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isPending, start] = useTransition();
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  // Walk-In Modal State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInSuccess, setWalkInSuccess] = useState<Booking | null>(null);
  const [walkInForm, setWalkInForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    packageId: "",
    dates: "Walk-In Onsite Access",
    amount: "",
    paymentMethod: "CASH",
    amountPaid: "",
    autoCheckIn: true,
    notes: "",
  });

  const loadPackages = () => {
    fetch("/api/admin/pricing")
      .then(r => r.json())
      .then(d => {
        setPackages(d.packages ?? []);
      })
      .catch(() => {});
  };

  const load = (query = q, status = statusFilter, type = typeFilter, currentPage = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    params.set("page", String(currentPage));
    params.set("limit", "15");

    fetch(`/api/admin/bookings?${params}`)
      .then(r => r.json())
      .then(d => {
        setBookings(d.bookings ?? []);
        setTotalPages(d.totalPages ?? 1);
        setTotalCount(d.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    load(q, statusFilter, typeFilter, page);
  }, [page, statusFilter, typeFilter]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(q, statusFilter, typeFilter, 1);
  };

  const handlePackageSelect = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    setWalkInForm(prev => ({
      ...prev,
      packageId: pkgId,
      amount: pkg ? String(pkg.price) : prev.amount,
      amountPaid: pkg && prev.paymentMethod === "CASH" ? String(pkg.price) : prev.amountPaid,
    }));
  };

  const changeDue = Math.max(
    0,
    (Number(walkInForm.amountPaid) || 0) - (Number(walkInForm.amount) || 0)
  );

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.customerName.trim() || !walkInForm.email.trim() || !walkInForm.phone.trim()) {
      toast.error("Please fill in the customer name, email, and phone number.");
      return;
    }
    if (!walkInForm.packageId) {
      toast.error("Please select a space or package.");
      return;
    }
    if (!walkInForm.amount || Number(walkInForm.amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    start(async () => {
      try {
        const payload = {
          ...walkInForm,
          amount: Number(walkInForm.amount),
          amountPaid: walkInForm.amountPaid ? Number(walkInForm.amountPaid) : Number(walkInForm.amount),
          changeGiven: changeDue,
        };

        const res = await fetch("/api/admin/bookings/walk-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          toast.success("Walk-in booking created & receipt emailed!");
          setWalkInSuccess(data.booking);
          load(q, statusFilter, typeFilter, 1);
        } else {
          const err = await res.json();
          toast.error(err.error ?? "Failed to create walk-in booking.");
        }
      } catch {
        toast.error("Network error creating walk-in booking.");
      }
    });
  };

  const resetWalkInForm = () => {
    setWalkInSuccess(null);
    setWalkInForm({
      customerName: "",
      email: "",
      phone: "",
      packageId: "",
      dates: "Walk-In Onsite Access",
      amount: "",
      paymentMethod: "CASH",
      amountPaid: "",
      autoCheckIn: true,
      notes: "",
    });
    setShowWalkInModal(false);
  };

  const handleCheckIn = (id: string) => {
    setCheckingIn(id);
    start(async () => {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, action: "checkin" }),
      });
      if (res.ok) {
        toast.success("Customer checked in!");
        load(q, statusFilter, typeFilter, page);
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Check-in failed.");
      }
      setCheckingIn(null);
    });
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      params.set("export", "1");

      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();
      const list: Booking[] = data.bookings ?? [];

      const headers = [
        "Booking ID",
        "Type",
        "Reference",
        "Customer Name",
        "Email",
        "Phone",
        "Package",
        "Amount (NGN)",
        "Payment Method",
        "Amount Paid",
        "Change Given",
        "Status",
        "Booked At",
        "Checked In At",
        "Checked In By",
      ];

      const rows = list.map(b => [
        `"${b.id}"`,
        `"${b.bookingType || "ONLINE"}"`,
        `"${b.reference}"`,
        `"${b.customerName.replace(/"/g, '""')}"`,
        `"${b.email}"`,
        `"${b.phone}"`,
        `"${b.package?.label ?? ""}"`,
        b.amount,
        `"${b.paymentMethod ?? (b.bookingType === "PHYSICAL" ? "CASH" : "PAYSTACK")}"`,
        b.amountPaid ?? b.amount,
        b.changeGiven ?? 0,
        `"${b.status}"`,
        `"${new Date(b.createdAt).toLocaleString()}"`,
        `"${b.checkedInAt ? new Date(b.checkedInAt).toLocaleString() : ""}"`,
        `"${b.checkedInBy?.name ?? b.checkedInBy?.username ?? ""}"`,
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `the-helm-space-bookings-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV export downloaded!");
    } catch {
      toast.error("Failed to export CSV.");
    } finally {
      setExporting(false);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Booking ID copied to clipboard!");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>
            Management
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Bookings & Walk-Ins
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
              {totalCount} total
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* New Walk-in Button */}
          <button
            onClick={() => {
              setWalkInSuccess(null);
              setShowWalkInModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:opacity-95"
            style={{ background: "#f1552b" }}
          >
            <i className="ti ti-user-plus text-base" />
            <span>+ New Walk-In Booking</span>
          </button>

          {/* Export button */}
          <button
            onClick={exportCSV}
            disabled={exporting || bookings.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-neutral-50 bg-white"
            style={{ borderColor: "#e5e5e5", color: "#141414" }}
          >
            {exporting ? (
              <i className="ti ti-loader-2 animate-spin text-sm" />
            ) : (
              <i className="ti ti-download text-sm" />
            )}
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by ID, customer name, email, phone, ref…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none bg-white"
            style={{ borderColor: "#e5e5e5", fontFamily: "Inter, sans-serif" }}
            onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
            onBlur={e => (e.target.style.boxShadow = "none")}
          />
        </div>

        {/* Type filter (Online vs Walk-in) */}
        <select
          value={typeFilter}
          onChange={e => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none font-medium"
          style={{ borderColor: "#e5e5e5" }}
        >
          <option value="">All Types (Online & Walk-In)</option>
          <option value="PHYSICAL">Walk-In / Physical</option>
          <option value="ONLINE">Online Bookings</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none"
          style={{ borderColor: "#e5e5e5" }}
        >
          <option value="">All Statuses</option>
          {["PENDING", "PAID", "CHECKED_IN", "COMPLETED", "CANCELLED", "FAILED"].map(s => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#141414" }}
        >
          Search
        </button>
      </form>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#ebebeb" }}>
        {loading ? (
          <div className="py-20 text-center">
            <i className="ti ti-loader-2 animate-spin text-2xl text-neutral-300" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center">
            <i className="ti ti-calendar-off text-4xl text-neutral-200 block mb-3" />
            <p className="text-sm text-neutral-400">No bookings found matching your filters.</p>
            <button
              onClick={() => {
                setShowWalkInModal(true);
                setWalkInSuccess(null);
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
              style={{ background: "#f1552b" }}
            >
              + Create Walk-In Booking
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "#f8f8f8" }}>
                <tr>
                  {["Booking ID & Ref", "Type", "Customer", "Package / Space", "Amount & Payment", "Status", "Date", "Action"].map(h => (
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
                {bookings.map(b => {
                  const isPhysical = b.bookingType === "PHYSICAL";
                  return (
                    <tr
                      key={b.id}
                      className="border-t hover:bg-neutral-50/60 transition-colors"
                      style={{ borderColor: "#f0f0f0" }}
                    >
                      {/* ID column */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#141414] bg-neutral-100 px-2 py-1 rounded-md">
                            {b.id}
                          </span>
                          <button
                            onClick={() => copyId(b.id)}
                            className="text-neutral-400 hover:text-[#f1552b] transition-colors p-1"
                            title="Copy ID"
                          >
                            <i className="ti ti-copy text-xs" />
                          </button>
                        </div>
                        <p className="text-[11px] font-mono text-neutral-400 mt-1">Ref: {b.reference}</p>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3.5">
                        {isPhysical ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                            <i className="ti ti-building text-xs" /> Walk-In
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                            <i className="ti ti-world text-xs" /> Online
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#141414]">{b.customerName}</p>
                        <p className="text-xs text-neutral-500">{b.email}</p>
                        <p className="text-xs text-neutral-400 font-mono">{b.phone}</p>
                      </td>

                      {/* Package */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[#141414]">{b.package?.label}</p>
                        {b.package?.sublabel && (
                          <p className="text-xs text-neutral-400">{b.package.sublabel}</p>
                        )}
                        {b.notes && (
                          <p className="text-[11px] text-neutral-400 italic mt-0.5">Note: {b.notes}</p>
                        )}
                      </td>

                      {/* Amount & Payment Method */}
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold text-[#141414]">{N(b.amount)}</p>
                        {b.paymentMethod && (
                          <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                            Method: <span className="font-semibold">{b.paymentMethod}</span>
                            {b.changeGiven && b.changeGiven > 0 ? ` (Change: ${N(b.changeGiven)})` : ""}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-block ${
                            STATUS_COLORS[b.status] ?? "bg-neutral-100"
                          }`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                        {b.checkedInAt && (
                          <p className="text-[10px] text-neutral-400 mt-1">
                            by {b.checkedInBy?.name ?? b.checkedInBy?.username}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-neutral-500 font-mono">
                        {new Date(b.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5">
                        {b.status === "PAID" && (
                          <button
                            onClick={() => handleCheckIn(b.id)}
                            disabled={isPending && checkingIn === b.id}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm"
                            style={{ background: "#f1552b" }}
                          >
                            {checkingIn === b.id ? "…" : "Check In"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && totalPages > 1 && (
          <div
            className="flex items-center justify-between px-6 py-4 border-t bg-[#fbfbfb]"
            style={{ borderColor: "#f0f0f0" }}
          >
            <p className="text-xs text-neutral-500">
              Page <span className="font-semibold text-[#141414]">{page}</span> of{" "}
              <span className="font-semibold text-[#141414]">{totalPages}</span> ({totalCount} items)
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-30 hover:bg-neutral-50 bg-white"
                style={{ borderColor: "#e5e5e5" }}
              >
                <i className="ti ti-chevron-left mr-1" /> Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                let pNum = page - 2 + idx;
                if (page < 3) pNum = idx + 1;
                else if (page > totalPages - 2) pNum = totalPages - 4 + idx;
                if (pNum < 1 || pNum > totalPages) return null;

                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      page === pNum
                        ? "bg-[#141414] text-white"
                        : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-30 hover:bg-neutral-50 bg-white"
                style={{ borderColor: "#e5e5e5" }}
              >
                Next <i className="ti ti-chevron-right ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* WALK-IN BOOKING MODAL */}
      {showWalkInModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b mb-6" style={{ borderColor: "#f0f0f0" }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ background: "#f1552b" }}
                >
                  <i className="ti ti-user-plus text-base" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    Physical / Walk-In Booking
                  </h3>
                  <p className="text-xs text-neutral-400">Register and check in an onsite visitor</p>
                </div>
              </div>
              <button
                onClick={resetWalkInForm}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700"
              >
                <i className="ti ti-x text-base" />
              </button>
            </div>

            {/* Success View */}
            {walkInSuccess ? (
              <div className="text-center py-4 space-y-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-white text-2xl shadow-lg"
                  style={{ background: "#10b981" }}
                >
                  <i className="ti ti-check" />
                </div>

                <div>
                  <h4 className="text-xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    Walk-In Booking Confirmed!
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    An email receipt with booking details has been sent to <strong>{walkInSuccess.email}</strong>.
                  </p>
                </div>

                {/* Prominent Booking ID card */}
                <div className="bg-[#141414] text-white p-5 rounded-2xl text-center space-y-2">
                  <p className="text-[10px] font-mono tracking-widest uppercase text-white/50">Generated Booking ID</p>
                  <p className="text-2xl font-bold font-mono text-[#f1552b] tracking-wider">{walkInSuccess.id}</p>
                  <p className="text-xs font-mono text-white/60">Ref: {walkInSuccess.reference}</p>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl text-left text-xs space-y-2 border" style={{ borderColor: "#f0f0f0" }}>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Customer Name:</span>
                    <span className="font-semibold text-[#141414]">{walkInSuccess.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Package:</span>
                    <span className="font-semibold text-[#141414]">{walkInSuccess.package?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Amount Paid:</span>
                    <span className="font-bold text-[#141414] font-mono">{N(walkInSuccess.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Status:</span>
                    <span className="font-bold text-emerald-600">✓ Checked In</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => copyId(walkInSuccess.id)}
                    className="flex-1 py-3 rounded-xl border text-xs font-bold text-neutral-700 hover:bg-neutral-50 flex items-center justify-center gap-1.5"
                    style={{ borderColor: "#e5e5e5" }}
                  >
                    <i className="ti ti-copy text-sm" /> Copy Booking ID
                  </button>
                  <button
                    onClick={resetWalkInForm}
                    className="flex-1 py-3 rounded-xl text-xs font-bold text-white shadow-sm"
                    style={{ background: "#141414" }}
                  >
                    Done / New Booking
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleWalkInSubmit} className="space-y-4">
                {/* Customer Details */}
                <div className="space-y-3">
                  <p className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    1. Customer Information
                  </p>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={walkInForm.customerName}
                      onChange={e => setWalkInForm(f => ({ ...f, customerName: e.target.value }))}
                      placeholder="e.g. Samuel Okonkwo"
                      className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none bg-white"
                      style={{ borderColor: "#e5e5e5" }}
                      onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                      onBlur={e => (e.target.style.boxShadow = "none")}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-500 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={walkInForm.email}
                        onChange={e => setWalkInForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="samuel@example.com"
                        className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none bg-white"
                        style={{ borderColor: "#e5e5e5" }}
                        onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                        onBlur={e => (e.target.style.boxShadow = "none")}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-500 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={walkInForm.phone}
                        onChange={e => setWalkInForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="08012345678"
                        className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none bg-white"
                        style={{ borderColor: "#e5e5e5" }}
                        onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                        onBlur={e => (e.target.style.boxShadow = "none")}
                      />
                    </div>
                  </div>
                </div>

                {/* Package & Pricing */}
                <div className="space-y-3 pt-2">
                  <p className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    2. Space & Pricing
                  </p>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 block mb-1">Select Package / Space *</label>
                    <select
                      required
                      value={walkInForm.packageId}
                      onChange={e => handlePackageSelect(e.target.value)}
                      className="w-full rounded-xl border px-4 py-2.5 text-sm bg-white focus:outline-none font-medium"
                      style={{ borderColor: "#e5e5e5" }}
                    >
                      <option value="">Select a package…</option>
                      {packages.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.label} {p.sublabel ? `(${p.sublabel})` : ""} — {N(p.price)} / {p.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-500 block mb-1">Charge Amount (NGN) *</label>
                      <input
                        type="number"
                        required
                        value={walkInForm.amount}
                        onChange={e => setWalkInForm(f => ({ ...f, amount: e.target.value }))}
                        placeholder="e.g. 5000"
                        className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none font-mono font-bold bg-white"
                        style={{ borderColor: "#e5e5e5" }}
                        onFocus={e => (e.target.style.boxShadow = "0 0 0 2px rgba(241,85,43,0.2)")}
                        onBlur={e => (e.target.style.boxShadow = "none")}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-500 block mb-1">Payment Method *</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { key: "CASH", label: "Cash", icon: "ti-cash" },
                          { key: "POS", label: "POS", icon: "ti-credit-card" },
                          { key: "TRANSFER", label: "Transfer", icon: "ti-building-bank" },
                        ].map(m => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setWalkInForm(f => ({ ...f, paymentMethod: m.key }))}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                              walkInForm.paymentMethod === m.key
                                ? "bg-[#141414] text-white border-[#141414] shadow-sm"
                                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                            }`}
                          >
                            <i className={`ti ${m.icon} text-sm`} />
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cash Tendered & Change Calculator */}
                  {walkInForm.paymentMethod === "CASH" && (
                    <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200 grid grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                          Cash Tendered (₦)
                        </label>
                        <input
                          type="number"
                          value={walkInForm.amountPaid}
                          onChange={e => setWalkInForm(f => ({ ...f, amountPaid: e.target.value }))}
                          placeholder={walkInForm.amount || "Amount handed"}
                          className="w-full rounded-lg border px-3 py-1.5 text-sm bg-white font-mono font-semibold"
                          style={{ borderColor: "#e5e5e5" }}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Change to Return</p>
                        <p className={`text-lg font-bold font-mono ${changeDue > 0 ? "text-[#f1552b]" : "text-neutral-700"}`}>
                          {N(changeDue)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Options */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoCheckIn"
                      checked={walkInForm.autoCheckIn}
                      onChange={e => setWalkInForm(f => ({ ...f, autoCheckIn: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#f1552b] focus:ring-0"
                    />
                    <label htmlFor="autoCheckIn" className="text-xs font-semibold text-[#141414] cursor-pointer">
                      Check in customer immediately upon submission
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 block mb-1">Front Desk Notes (Optional)</label>
                    <input
                      type="text"
                      value={walkInForm.notes}
                      onChange={e => setWalkInForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="e.g. Desk #4 assigned, preferred quiet area"
                      className="w-full rounded-xl border px-4 py-2 text-xs focus:outline-none bg-white"
                      style={{ borderColor: "#e5e5e5" }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={resetWalkInForm}
                    className="flex-1 py-3 rounded-xl border text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                    style={{ borderColor: "#e5e5e5" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-2 py-3 px-6 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2"
                    style={{ background: isPending ? "#888" : "#f1552b" }}
                  >
                    {isPending ? (
                      <>
                        <i className="ti ti-loader-2 animate-spin text-sm" /> Processing…
                      </>
                    ) : (
                      <>
                        <i className="ti ti-check text-sm" /> Complete Walk-In Booking
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
