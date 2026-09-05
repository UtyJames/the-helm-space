import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/shifts — clock in
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { location } = await req.json();
  if (!location) return NextResponse.json({ error: "Location required" }, { status: 400 });

  // Check if already clocked in today
  const today = new Date(); today.setHours(0,0,0,0);
  const existing = await prisma.shift.findFirst({ where: { userId, clockOutAt: null, clockInAt: { gte: today } } });
  if (existing) return NextResponse.json({ error: "Already clocked in", shift: existing }, { status: 409 });

  const shift = await prisma.shift.create({
    data: { userId, clockInLocation: location },
  });

  return NextResponse.json({ success: true, shift });
}

// GET /api/admin/shifts — get active shift for current user
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const today = new Date(); today.setHours(0,0,0,0);
  const shift = await prisma.shift.findFirst({
    where: { userId, clockOutAt: null, clockInAt: { gte: today } },
  });

  return NextResponse.json({ shift });
}
