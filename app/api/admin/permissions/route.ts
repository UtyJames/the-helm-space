import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as { id: string; role?: string; name?: string | null; username?: string };
}

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const pending = url.searchParams.get("pending");
  const staffId = url.searchParams.get("staffId");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const take = 20;

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  // Count-only mode for badge
  if (pending === "1" && isSuperAdmin) {
    const count = await prisma.permission.count({ where: { status: "PENDING" } });
    return NextResponse.json({ count });
  }

  const where = isSuperAdmin
    ? staffId ? { userId: staffId } : {}
    : { userId: user.id };

  const [permissions, total] = await Promise.all([
    prisma.permission.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true, email: true } },
        approvedBy: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    prisma.permission.count({ where }),
  ]);

  return NextResponse.json({ permissions, total, page, pages: Math.ceil(total / take) });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dateFrom, dateTill, reason, details } = await req.json();
  if (!dateFrom || !dateTill || !reason || !details) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const from = new Date(dateFrom);
  const till = new Date(dateTill);
  if (till <= from) return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });

  const durationDays = Math.ceil((till.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  const permission = await prisma.permission.create({
    data: {
      userId: user.id,
      dateFrom: from,
      dateTill: till,
      durationDays,
      reason,
      details,
      status: "PENDING",
    },
    include: { user: { select: { name: true, username: true, email: true } } },
  });

  return NextResponse.json({ success: true, permission });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action } = await req.json();
  if (!id || !action) return NextResponse.json({ error: "ID and action required" }, { status: 400 });

  if (action === "cancel") {
    // User cancels their own pending permission
    const perm = await prisma.permission.findUnique({ where: { id } });
    if (!perm) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (perm.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (perm.status !== "PENDING") return NextResponse.json({ error: "Can only cancel pending permissions" }, { status: 400 });

    await prisma.permission.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    return NextResponse.json({ success: true });
  }

  if (action === "approve" || action === "decline") {
    if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const perm = await prisma.permission.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!perm) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.permission.update({
      where: { id },
      data: {
        status: action === "approve" ? "APPROVED" : "DECLINED",
        approvedById: user.id,
        approvedAt: new Date(),
        seenBySuperAdmin: true,
      },
      include: { user: { select: { name: true, email: true } }, approvedBy: { select: { name: true } } },
    });

    // Send email notification (fire-and-forget)
    if (perm.user.email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/permission-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: perm.user.email,
            name: perm.user.name,
            status: action === "approve" ? "APPROVED" : "DECLINED",
            dateFrom: perm.dateFrom,
            dateTill: perm.dateTill,
            reason: perm.reason,
          }),
        });
      } catch { /* email fail shouldn't block response */ }
    }

    return NextResponse.json({ success: true, permission: updated });
  }

  if (action === "markSeen" && user.role === "SUPER_ADMIN") {
    await prisma.permission.update({ where: { id }, data: { seenBySuperAdmin: true } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
