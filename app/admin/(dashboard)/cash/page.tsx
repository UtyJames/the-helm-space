import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const N = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default async function CashPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");
  const user = session.user as { role?: string };
  if (user.role !== "SUPER_ADMIN") redirect("/admin/dashboard");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [todayRev, weekRev, monthRev, allRev] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: today } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: weekStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: monthStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
  ]);

  const recentPayments = await prisma.payment.findMany({
    orderBy: { paidAt: "desc" },
    take: 50,
    include: { booking: { select: { customerName: true, reference: true, package: { select: { label: true } } } } },
  });

  const paymentsByDay = await prisma.payment.groupBy({
    by: ["paidAt"],
    _sum: { amount: true },
    where: { paidAt: { gte: monthStart } },
    orderBy: { paidAt: "asc" },
  });

  return (
    <div className="p-6 md:p-8">
      <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>Finance</p>
      <h1 className="text-2xl font-bold text-[#141414] mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Cash Inflow</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today", value: N(todayRev._sum.amount ?? 0), sub: "Since midnight" },
          { label: "This Week", value: N(weekRev._sum.amount ?? 0), sub: "Current week" },
          { label: "This Month", value: N(monthRev._sum.amount ?? 0), sub: "Month to date" },
          { label: "All Time", value: N(allRev._sum.amount ?? 0), sub: "Total revenue", highlight: true },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#ebebeb" }}>
            <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mb-2">{label}</p>
            <p className="text-xl font-bold" style={{ color: highlight ? "#f1552b" : "#141414", fontFamily: "Space Grotesk, sans-serif" }}>{value}</p>
            <p className="text-xs text-neutral-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent payments table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#ebebeb" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
          <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">Recent Payments</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: "#f8f8f8" }}>
              <tr>
                {["Customer","Package","Amount","Channel","Paid At"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-neutral-400 text-sm">No payments yet.</td></tr>
              ) : recentPayments.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-neutral-50/60 transition-colors" style={{ borderColor: "#f0f0f0" }}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#141414]">{p.booking.customerName}</p>
                    <p className="text-xs font-mono text-neutral-400">{p.booking.reference}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{p.booking.package.label}</td>
                  <td className="px-4 py-3 font-mono font-semibold" style={{ color: "#f1552b" }}>{N(p.amount)}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500 capitalize">{p.channel ?? "paystack"}</td>
                  <td className="px-4 py-3 text-xs text-neutral-400">
                    {new Date(p.paidAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
