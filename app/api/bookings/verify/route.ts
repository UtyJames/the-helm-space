import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAID_STATUSES = new Set(["PAID", "CHECKED_IN", "COMPLETED"]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = (url.searchParams.get("reference") ?? url.searchParams.get("ref") ?? "").trim();
  if (!reference || reference.length > 128) {
    return NextResponse.json({ error: "A valid booking reference is required." }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { reference },
      include: { package: true },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const paid = PAID_STATUSES.has(booking.status);
    return NextResponse.json(
      { success: paid, paid, pending: booking.status === "PENDING", booking },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Booking status lookup failed:", error);
    return NextResponse.json({ error: "Unable to check booking status." }, { status: 500 });
  }
}
