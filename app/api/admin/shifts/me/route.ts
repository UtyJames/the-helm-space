import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string };
  const url = new URL(req.url);
  const month = parseInt(url.searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()));

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const shifts = await prisma.shift.findMany({
    where: { userId: user.id, clockInAt: { gte: start, lt: end } },
    orderBy: { clockInAt: "asc" },
  });

  return NextResponse.json({ shifts });
}
