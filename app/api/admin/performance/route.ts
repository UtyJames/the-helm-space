import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role?: string };
  if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const staffId = url.searchParams.get("staffId");
  const month = parseInt(url.searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);
  const year = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1);

  // Fetch all staff
  const staffList = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, username: true, role: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  // Selected staff or all
  const targetStaffIds = staffId ? [staffId] : staffList.map((s: { id: string }) => s.id);

  const [shifts, tasks] = await Promise.all([
    prisma.shift.findMany({
      where: {
        userId: { in: targetStaffIds },
        clockInAt: { gte: startOfMonth, lt: endOfMonth },
      },
      orderBy: { clockInAt: "asc" },
    }),
    prisma.task.findMany({
      where: {
        assignedToId: { in: targetStaffIds },
      },
      include: {
        assignedTo: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    staff: staffList,
    shifts,
    tasks,
    month,
    year,
  });
}
