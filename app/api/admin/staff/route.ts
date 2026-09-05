import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Only SUPER_ADMIN can access staff management
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { id: string; role?: string };
  if (user.role !== "SUPER_ADMIN") return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const staff = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, username: true, email: true, role: true, active: true, password: true, pin: true, createdAt: true },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, username, password, pin, role, email } = await req.json();
  if (!username || !password) return NextResponse.json({ error: "Username and password required" }, { status: 400 });

  const cleanUsername = username.trim();
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: cleanUsername },
        { username: { equals: cleanUsername, mode: "insensitive" } },
      ],
    },
  });
  if (existing) return NextResponse.json({ error: "Username already exists" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      name: name || cleanUsername,
      username: cleanUsername,
      email: email || null,
      password,
      pin: pin ? pin.trim() : null,
      role: role ?? "RECEPTIONIST",
    },
  });

  return NextResponse.json({ success: true, user: { ...user, password, pin } });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, password, pin, active, name, email, role, username } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (password !== undefined) data.password = password;
  if (pin !== undefined) data.pin = pin ? String(pin).trim() : null;
  if (active !== undefined) data.active = Boolean(active);
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (role !== undefined) data.role = role;
  if (username !== undefined) data.username = String(username).trim();

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ success: true, user });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  if (id === admin.id) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    await prisma.user.update({ where: { id }, data: { active: false } });
  }

  return NextResponse.json({ success: true });
}
