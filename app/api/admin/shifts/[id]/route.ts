import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/shifts/[id] — clock out
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { location } = await req.json();

  const shift = await prisma.shift.update({
    where: { id },
    data: { clockOutAt: new Date(), clockOutLocation: location ?? "" },
  });

  return NextResponse.json({ success: true, shift });
}
