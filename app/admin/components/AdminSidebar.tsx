"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { adminSignOut } from "@/app/admin/actions";
import { useTransition, useEffect, useState } from "react";

type NavItem = { href: string; icon: string; label: string; roles?: string[]; badgeKey?: string };

const NAV: NavItem[] = [
  { href: "/admin/dashboard",    icon: "ti-layout-dashboard", label: "Dashboard" },
  { href: "/admin/bookings",     icon: "ti-calendar",          label: "Bookings" },
  { href: "/admin/clock",        icon: "ti-clock",             label: "Clock In / Out" },
  { href: "/admin/tasks",        icon: "ti-checklist",         label: "My Tasks" },
  { href: "/admin/permissions",  icon: "ti-calendar-off",      label: "Permissions", badgeKey: "permissions" },
  { href: "/admin/staff",        icon: "ti-users",             label: "Staff",        roles: ["SUPER_ADMIN"] },
  { href: "/admin/customers",    icon: "ti-crown",             label: "Customers",    roles: ["SUPER_ADMIN"] },
  { href: "/admin/performance",  icon: "ti-chart-bar",         label: "Performance",  roles: ["SUPER_ADMIN"] },
  { href: "/admin/tasks/manage", icon: "ti-clipboard-list",    label: "Assign Tasks", roles: ["SUPER_ADMIN"] },
  { href: "/admin/pricing",      icon: "ti-tag",               label: "Pricing",      roles: ["SUPER_ADMIN"] },
  { href: "/admin/cash",         icon: "ti-cash",              label: "Cash Inflow",  roles: ["SUPER_ADMIN"] },
  { href: "/admin/discounts",    icon: "ti-discount",          label: "Discounts",    roles: ["SUPER_ADMIN"] },
];

type Props = { role: string; name: string; username: string };

export default function AdminSidebar({ role, name, username }: Props) {
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [permBadge, setPermBadge] = useState(0);

  // Fetch pending permissions count for super admin
  useEffect(() => {
    if (role !== "SUPER_ADMIN") return;
    fetch("/api/admin/permissions?pending=1")
      .then(r => r.json())
      .then(d => setPermBadge(d.count ?? 0))
      .catch(() => {});
  }, [role]);

  const links = NAV.filter((n) => !n.roles || n.roles.includes(role));
  const generalLinks = links.filter(n => !n.roles);
  const mgmtLinks = links.filter(n => n.roles);

  const renderLink = (item: NavItem) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const badge = item.badgeKey === "permissions" && role === "SUPER_ADMIN" ? permBadge : 0;
    return (
      <Link key={item.href} href={item.href}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group relative"
        style={{
          background: active ? "rgba(241,85,43,0.15)" : "transparent",
          color: active ? "#f1552b" : "rgba(255,255,255,0.6)",
        }}
      >
        <i className={`ti ${item.icon} text-base`} />
        <span>{item.label}</span>
        {badge > 0 && (
          <span
            className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: "#f1552b", minWidth: 18, textAlign: "center" }}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className="flex flex-col w-64 min-h-screen flex-shrink-0 border-r"
      style={{ background: "#141414", borderColor: "#222" }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "#222" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden p-0.5" style={{ background: "#ffffff" }}>
            <Image
              src="/THS-FAVICON.svg"
              alt="The Helm Space"
              width={24}
              height={24}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-white text-[13px] font-bold leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>The Helm Space</p>
            <p className="text-white/40 text-[10px] mt-0.5 font-mono">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {role === "SUPER_ADMIN" && (
          <p className="text-white/25 text-[9px] font-mono tracking-widest uppercase px-3 pb-2 pt-1">General</p>
        )}
        {generalLinks.map(renderLink)}

        {role === "SUPER_ADMIN" && (
          <>
            <p className="text-white/25 text-[9px] font-mono tracking-widest uppercase px-3 pb-2 pt-4">Management</p>
            {mgmtLinks.map(renderLink)}
          </>
        )}
      </nav>

      {/* User + sign out */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "#222" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ background: "#f1552b" }}>
            {(name || username)[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-[12px] font-semibold truncate">{name || username}</p>
            <p className="text-white/35 text-[10px] capitalize">{role === "SUPER_ADMIN" ? "Super Admin" : "Receptionist"}</p>
          </div>
        </div>
        <form action={async () => { start(async () => { await adminSignOut(); }); }}>
          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
            style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
          >
            <i className="ti ti-logout text-sm" />
            {pending ? "Signing out…" : "Sign Out"}
          </button>
        </form>
      </div>
    </aside>
  );
}
