import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const bookingType = url.searchParams.get("type") ?? "";
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "15", 10);
  const exportAll = url.searchParams.get("export") === "1";

  const where = {
    ...(q ? {
      OR: [
        { customerName: { contains: q, mode: "insensitive" as const } },
        { id: { contains: q, mode: "insensitive" as const } },
        { reference: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(status ? { status: status as never } : {}),
    ...(bookingType ? { bookingType } : {}),
  };

  if (exportAll) {
    const allBookings = await prisma.booking.findMany({
      where,
      include: { package: true, checkedInBy: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ bookings: allBookings, total: allBookings.length });
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { package: true, checkedInBy: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({
    bookings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { bookingId, action } = await req.json();

  if (action === "checkin") {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CHECKED_IN", checkedInAt: new Date(), checkedInById: userId },
    });
    return NextResponse.json({ success: true, booking });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
