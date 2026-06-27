import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import prisma from "../../../lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!userExists) {
    return NextResponse.json(
      { error: "User not found. Please sign in again." },
      { status: 401 }
    );
  }

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, priority, color } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "User not found. Please sign in again." },
        { status: 401 }
      );
    }

    const note = await prisma.note.create({
      data: {
        title: title || null,
        content: content.trim(),
        priority: priority || "MEDIUM",
        color: color || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
