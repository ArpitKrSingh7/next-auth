import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "../../../../lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, content, priority, color, isPublic } = body;

    // Verify the note belongs to the current user
    const existingNote = await prisma.note.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title || null }),
        ...(content !== undefined && { content: content.trim() }),
        ...(priority !== undefined && { priority }),
        ...(color !== undefined && { color: color || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Update note error:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existingNote = await prisma.note.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Note deleted" });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
