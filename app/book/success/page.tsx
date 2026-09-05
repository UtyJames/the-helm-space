"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

const N = (n: number) => "₦" + n.toLocaleString("en-NG");

interface BookingInfo {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  amount: number;
  status: string;
  dates?: string | null;
  createdAt: string;
  package?: {
    label: string;
    sublabel?: string | null;
    unit?: string;
  };
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || searchParams.get("reference");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ref) {
      setError("No booking reference provided.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function verify() {
      try {
        const res = await fetch(`/api/bookings/verify?ref=${encodeURIComponent(ref!)}`);
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.success && data.booking) {
          setBooking(data.booking);
        } else {
          setError(data.error || "Could not verify your payment. Please reach out to support.");
        }
      } catch (e) {
        if (isMounted) setError("Network error while verifying payment.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verify();
    return () => {
      isMounted = false;
    };
  }, [ref]);

  const copyRef = () => {
    if (!ref) return;
    navigator.clipboard.writeText(ref);
    setCopied(true);
    toast.success("Reference copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full border-4 border-[#f1552b]/20 border-t-[#f1552b] animate-spin mb-4" />
        <h2 className="text-xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Verifying Your Payment…
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-sm">
          Please wait while we confirm your transaction with Paystack and activate your reservation.
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-neutral-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
          ✕
        </div>
        <h2 className="text-xl font-bold text-[#141414] mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Verification Issue
        </h2>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">{error}</p>
        <div className="flex flex-col gap-2">
          {ref && (
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
              style={{ background: "#f1552b" }}
            >
              Retry Verification
            </button>
          )}
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition text-center"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const parsedDates: string[] = (() => {
    if (!booking.dates) return [];
    try {
      const p = JSON.parse(booking.dates);
      return Array.isArray(p) ? p : [String(booking.dates)];
    } catch {
      return [String(booking.dates)];
    }
  })();

  return (
    <div className="max-w-xl mx-auto my-8 md:my-14 px-4">
      {/* Success Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 text-center bg-gradient-to-b from-[#faf9f7] to-white border-b border-neutral-100">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#f1552b] font-semibold mb-1">Booking Confirmed</p>
          <h1 className="text-2xl md:text-3xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            You&apos;re All Set!
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Your space reservation has been successfully paid and recorded.
          </p>

          {/* Reference Badge */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-200">
            <span className="text-xs text-neutral-400 font-mono">REFERENCE:</span>
            <span className="font-mono font-bold text-sm text-[#141414] tracking-wide">{booking.reference}</span>
            <button
              onClick={copyRef}
              className="ml-1 text-xs text-[#f1552b] hover:underline font-semibold cursor-pointer"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Details Breakdown */}
        <div className="p-6 md:p-8 space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-neutral-100 text-sm">
            <span className="text-neutral-500">Package</span>
            <span className="font-semibold text-[#141414]">
              {booking.package?.label ?? "Workspace Package"}
              {booking.package?.sublabel && ` (${booking.package.sublabel})`}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-100 text-sm">
            <span className="text-neutral-500">Guest Name</span>
            <span className="font-medium text-[#141414]">{booking.customerName}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-100 text-sm">
            <span className="text-neutral-500">Email Address</span>
            <span className="font-medium text-[#141414]">{booking.email}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-100 text-sm">
            <span className="text-neutral-500">Phone Number</span>
            <span className="font-medium text-[#141414]">{booking.phone}</span>
          </div>

          {parsedDates.length > 0 && (
            <div className="flex justify-between items-start py-2 border-b border-neutral-100 text-sm">
              <span className="text-neutral-500">Selected Dates</span>
              <span className="font-medium text-[#141414] text-right">
                {parsedDates.join(", ")}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 text-base">
            <span className="font-semibold text-[#141414]">Amount Paid</span>
            <span className="font-mono font-bold text-lg" style={{ color: "#f1552b" }}>
              {N(booking.amount)}
            </span>
          </div>
        </div>

        {/* Check-in Notice */}
        <div className="px-6 md:px-8 py-4 bg-[#faf9f7] border-t border-neutral-100 text-xs text-neutral-600 leading-relaxed">
          <p className="font-semibold text-[#141414] mb-1">Checking in at The Helm Space:</p>
          Show your booking reference <strong className="font-mono text-[#141414]">{booking.reference}</strong> at the front desk when you arrive. Our team will verify and assign your workspace immediately.
        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <path d="M6 14h12v8H6z"/>
            </svg>
            Print Receipt
          </button>
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl text-white text-sm font-semibold text-center hover:opacity-90 transition flex items-center justify-center"
            style={{ background: "#f1552b" }}
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <main className="min-h-screen bg-[#faf9f7] py-8">
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Inter, sans-serif", fontSize: 13 } }} />
      <Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#f1552b]/20 border-t-[#f1552b] rounded-full animate-spin" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
