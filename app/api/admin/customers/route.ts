import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { id: string; role?: string };
  if (user.role !== "SUPER_ADMIN") return null;
  return user;
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const take = parseInt(url.searchParams.get("take") ?? "20", 10);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();

  // Aggregate all completed, paid, and checked in bookings (both ONLINE and PHYSICAL)
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      reference: true,
      customerName: true,
      email: true,
      phone: true,
      amount: true,
      status: true,
      bookingType: true,
      paymentMethod: true,
      createdAt: true,
      package: { select: { label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by customer email (fallback to phone if email empty)
  const customerMap = new Map<string, {
    email: string;
    name: string;
    phone: string;
    totalBookings: number;
    onlineBookings: number;
    walkInBookings: number;
    totalSpend: number;
    lastBooking: string;
    statuses: string[];
  }>();

  for (const b of bookings) {
    const rawEmail = (b.email || "").trim().toLowerCase();
    const rawPhone = (b.phone || "").trim();
    const key = rawEmail || rawPhone;
    if (!key) continue;

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        email: b.email.trim(),
        name: b.customerName.trim(),
        phone: b.phone.trim(),
        totalBookings: 0,
        onlineBookings: 0,
        walkInBookings: 0,
        totalSpend: 0,
        lastBooking: b.createdAt.toISOString(),
        statuses: [],
      });
    }

    const c = customerMap.get(key)!;
    c.totalBookings++;

    if (b.bookingType === "PHYSICAL") {
      c.walkInBookings++;
    } else {
      c.onlineBookings++;
    }

    // Count spend for all paid/checked_in/completed bookings (online & walk-ins)
    if (b.status === "PAID" || b.status === "CHECKED_IN" || b.status === "COMPLETED") {
      c.totalSpend += b.amount;
    }

    if (new Date(b.createdAt) > new Date(c.lastBooking)) {
      c.lastBooking = b.createdAt.toISOString();
      // Keep most recent customer name and phone
      if (b.customerName) c.name = b.customerName.trim();
      if (b.phone) c.phone = b.phone.trim();
    }
    c.statuses.push(b.status);
  }

  let allCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.totalSpend - a.totalSpend);

  if (q) {
    allCustomers = allCustomers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }

  const total = allCustomers.length;
  const paginated = allCustomers.slice((page - 1) * take, page * take);

  // Leaderboard: top 15 ranked by total spend
  const leaderboard = allCustomers.slice(0, 15).map((c, i) => ({ ...c, rank: i + 1 }));

  return NextResponse.json({
    customers: paginated,
    total,
    pages: Math.ceil(total / take) || 1,
    page,
    leaderboard,
  });
}
