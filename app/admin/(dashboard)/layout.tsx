import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import NetworkStatus from "@/app/admin/components/NetworkStatus";
import { Toaster } from "react-hot-toast";
import type { ReactNode } from "react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const user = session.user as { id: string; name?: string | null; username?: string; role?: string };
  const role = user.role ?? "RECEPTIONIST";
  const name = user.name ?? user.username ?? "Staff";
  const username = user.username ?? "";

  return (
    <div className="flex min-h-screen" style={{ background: "#f8f7f5", fontFamily: "Inter, sans-serif" }}>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: "Inter, sans-serif", fontSize: 13 },
        success: { iconTheme: { primary: "#f1552b", secondary: "#fff" } },
      }}/>
      <NetworkStatus />
      <AdminSidebar role={role} name={name} username={username} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b bg-white flex items-center px-6 gap-4 flex-shrink-0" style={{ borderColor: "#ebebeb" }}>
          <div className="flex-1">
            <p className="text-[11px] text-neutral-400 font-mono">
              {new Date().toLocaleDateString("en-GB", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{
              background: role === "SUPER_ADMIN" ? "rgba(241,85,43,0.12)" : "rgba(20,20,20,0.07)",
              color: role === "SUPER_ADMIN" ? "#f1552b" : "#141414",
            }}>
              {role === "SUPER_ADMIN" ? "Super Admin" : "Receptionist"}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
