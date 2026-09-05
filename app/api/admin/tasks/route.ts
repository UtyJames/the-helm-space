import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role?: string };
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const tasks = await prisma.task.findMany({
    where: isSuperAdmin ? {} : { assignedToId: user.id },
    include: {
      assignedTo: { select: { id: true, name: true, username: true } },
      createdBy:  { select: { id: true, name: true, username: true } },
      comments: {
        include: { author: { select: { name: true, username: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role?: string };
  const body = await req.json();

  if (body.action === "comment") {
    const { taskId, content } = body;
    const comment = await prisma.taskComment.create({
      data: { taskId, authorId: user.id, content },
      include: { author: { select: { name: true, username: true } } },
    });
    return NextResponse.json({ success: true, comment });
  }

  // Create task — Super Admin only
  if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, assignedToId, dueDate, repeatType, repeatDays, repeatDates } = body;
  if (!title || !assignedToId) return NextResponse.json({ error: "Title and assignee required" }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      assignedToId,
      createdById: user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      repeatType: repeatType ?? "NONE",
      repeatDays: repeatDays ?? null,
      repeatDates: repeatDates ? JSON.stringify(repeatDates) : null,
      dueForDate: repeatType && repeatType !== "NONE" ? new Date() : null,
    },
    include: {
      assignedTo: { select: { name: true, username: true } },
      createdBy:  { select: { name: true, username: true } },
      comments: true,
    },
  });

  return NextResponse.json({ success: true, task });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role?: string };
  const body = await req.json();

  // Mark all tasks as done for current user
  if (body.action === "markAll") {
    const where = user.role === "SUPER_ADMIN" ? {} : { assignedToId: user.id };
    await prisma.task.updateMany({
      where: { ...where, status: { not: "DONE" } },
      data: { status: "DONE", completedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  }

  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: "ID and status required" }, { status: 400 });

  const task = await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });
  return NextResponse.json({ success: true, task });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role?: string };
  if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
