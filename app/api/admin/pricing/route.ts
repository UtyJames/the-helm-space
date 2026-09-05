import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const packages = await prisma.package.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ packages });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role?: string };
  if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, price, origPrice, active } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const pkg = await prisma.package.update({
    where: { id },
    data: {
      ...(price !== undefined ? { price } : {}),
      ...(origPrice !== undefined ? { origPrice } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  });
  return NextResponse.json({ success: true, package: pkg });
}
