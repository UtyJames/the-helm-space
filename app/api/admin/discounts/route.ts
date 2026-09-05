import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role?: string };
  if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "PENDING";

  const requests = await prisma.discountRequest.findMany({
    where: { status: status as never },
    include: { requestedBy: { select: { name: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { bookingRef, customerName, amountOff, reason } = await req.json();
  if (!customerName || !amountOff || !reason) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const request = await prisma.discountRequest.create({
    data: { bookingRef, customerName, amountOff, reason, requestedById: userId },
  });

  return NextResponse.json({ success: true, request });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string; role?: string };
  if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  const request = await prisma.discountRequest.update({
    where: { id },
    data: { status, decidedById: user.id },
  });

  return NextResponse.json({ success: true, request });
}
