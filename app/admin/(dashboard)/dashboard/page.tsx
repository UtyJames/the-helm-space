import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StaffAttendanceCalendar from "../components/StaffAttendanceCalendar";
import RecentPermissions from "../components/RecentPermissions";

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#ebebeb" }}>
      <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color: color ?? "#141414", fontFamily: "Space Grotesk, sans-serif" }}>{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");
  const user = session.user as { id: string; role?: string; name?: string | null; username?: string };
  const role = user.role ?? "RECEPTIONIST";

  // Shared stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayBookings = await prisma.booking.count({ where: { createdAt: { gte: today } } });
  const pendingCheckins = await prisma.booking.count({ where: { status: "PAID" } });

  // Check if staff clocked in today
  const activeShift = await prisma.shift.findFirst({
    where: { userId: user.id, clockOutAt: null, clockInAt: { gte: today } },
  });

  const myTasks = await prisma.task.count({ where: { assignedToId: user.id, status: { not: "DONE" } } });

  if (role === "SUPER_ADMIN") {
    const totalRevenue = await prisma.payment.aggregate({ _sum: { amount: true } });
    const todayRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: today } },
    });
    const staffCount = await prisma.user.count({ where: { active: true } });
    const clockedIn = await prisma.shift.count({ where: { clockOutAt: null, clockInAt: { gte: today } } });
    const pendingDiscounts = await prisma.discountRequest.count({ where: { status: "PENDING" } });
    const pendingPermissions = await prisma.permission.count({ where: { status: "PENDING" } });
    const allTasks = await prisma.task.count({ where: { status: { not: "DONE" } } });

    const N = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

    return (
      <div className="p-6 md:p-8 space-y-8">
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>Overview</p>
          <h1 className="text-2xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user.name?.split(" ")[0] ?? "Admin"} 👋
          </h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={N(totalRevenue._sum.amount ?? 0)} sub="All time" color="#f1552b"/>
          <StatCard label="Today's Revenue" value={N(todayRevenue._sum.amount ?? 0)} sub="Since midnight"/>
          <StatCard label="Today's Bookings" value={todayBookings} sub="New today"/>
          <StatCard label="Pending Check-ins" value={pendingCheckins} sub="Paid, not checked in"/>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Staff" value={staffCount} sub="Total accounts"/>
          <StatCard label="Clocked In" value={clockedIn} sub="Working now"/>
          <StatCard label="Pending Permissions" value={pendingPermissions} sub="Awaiting approval" color={pendingPermissions > 0 ? "#f1552b" : undefined}/>
          <StatCard label="Pending Discounts" value={pendingDiscounts} sub="Awaiting review" color={pendingDiscounts > 0 ? "#f1552b" : undefined}/>
        </div>

        {/* Permissions Approval Section for Super Admin */}
        <RecentPermissions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#ebebeb" }}>
            <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mb-4">Quick Links</p>
            <div className="space-y-2">
              {[
                { href: "/admin/bookings", label: "Manage Bookings", icon: "ti-calendar" },
                { href: "/admin/customers", label: "Customers & Leaderboard", icon: "ti-crown" },
                { href: "/admin/staff", label: "Manage Staff", icon: "ti-users" },
                { href: "/admin/permissions", label: "Permissions Management", icon: "ti-calendar-off" },
                { href: "/admin/performance", label: "Staff Attendance & Performance", icon: "ti-chart-bar" },
                { href: "/admin/tasks/manage", label: "Assign & Repeat Tasks", icon: "ti-clipboard-list" },
              ].map(l => (
                <a key={l.label} href={l.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-neutral-50"
                  style={{ color: "#141414" }}>
                  <i className={`ti ${l.icon} text-base`} style={{ color: "#f1552b" }}/>
                  {l.label}
                  <i className="ti ti-chevron-right ml-auto text-neutral-300"/>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#ebebeb" }}>
            <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mb-4">Your Status</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#f5f5f5" }}>
                <span className="text-sm text-neutral-600">Clock-in status</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${activeShift ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                  {activeShift ? "✓ Clocked In" : "Not clocked in"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#f5f5f5" }}>
                <span className="text-sm text-neutral-600">Open tasks for me</span>
                <span className="text-sm font-bold" style={{ color: myTasks > 0 ? "#f1552b" : "#141414" }}>{myTasks}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-neutral-600">Open tasks (all staff)</span>
                <span className="text-sm font-bold" style={{ color: "#141414" }}>{allTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Receptionist / Staff dashboard
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "#f1552b" }}>My Dashboard</p>
        <h1 className="text-2xl font-bold text-[#141414]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user.name?.split(" ")[0] ?? "Team"} 👋
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Bookings"  value={todayBookings}  sub="New today"/>
        <StatCard label="Pending Check-ins" value={pendingCheckins} sub="Need checking in" color={pendingCheckins > 0 ? "#f1552b" : undefined}/>
        <StatCard label="My Open Tasks"     value={myTasks}         sub="Assigned to me" color={myTasks > 0 ? "#f1552b" : undefined}/>
        <StatCard label="Clock Status"      value={activeShift ? "In" : "Out"} sub={activeShift ? "Currently clocked in" : "Not clocked in"} color={activeShift ? "#10b981" : undefined}/>
      </div>

      {/* Staff Attendance Calendar Component */}
      <StaffAttendanceCalendar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#ebebeb" }}>
          <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mb-4">Quick Actions</p>
          <div className="space-y-2">
            {[
              { href: "/admin/bookings",     label: "+ New Walk-In Booking", icon: "ti-user-plus" },
              { href: "/admin/clock",        label: activeShift ? "Clock Out" : "Clock In", icon: "ti-clock" },
              { href: "/admin/bookings",     label: "View All Bookings", icon: "ti-calendar" },
              { href: "/admin/tasks",        label: "My Tasks", icon: "ti-checklist" },
              { href: "/admin/permissions",  label: "Request Permission / Leave", icon: "ti-calendar-off" },
            ].map(l => (
              <a key={l.label} href={l.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-neutral-50"
                style={{ color: "#141414" }}>
                <i className={`ti ${l.icon} text-base`} style={{ color: "#f1552b" }}/>
                {l.label}
                <i className="ti ti-chevron-right ml-auto text-neutral-300"/>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#ebebeb" }}>
          <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mb-4">Shift Status</p>
          {activeShift ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-emerald-100">
                <i className="ti ti-clock text-emerald-600 text-xl"/>
              </div>
              <p className="font-semibold text-[#141414] text-sm">You are clocked in</p>
              <p className="text-xs text-neutral-400 mt-1">
                Since {new Date(activeShift.clockInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-neutral-100">
                <i className="ti ti-clock-off text-neutral-400 text-xl"/>
              </div>
              <p className="font-semibold text-neutral-600 text-sm">Not clocked in</p>
              <a href="/admin/clock" className="text-xs mt-2 inline-block font-medium" style={{ color: "#f1552b" }}>
                Clock in now →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
