import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

interface NoteInput {
  title: string | null;
  content: string;
  priority: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Groq API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const { notes } = (await req.json()) as { notes: NoteInput[] };

    if (!notes || notes.length === 0) {
      return NextResponse.json(
        { error: "No notes to summarize" },
        { status: 400 }
      );
    }

    const notesText = notes
      .map(
        (note, index) =>
          `${index + 1}. [${note.priority}] ${note.title ? note.title + ": " : ""}${note.content}`
      )
      .join("\n");

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Summarize the user's sticky notes briefly. Highlight high-priority items. Keep it under 150 words.",
        },
        {
          role: "user",
          content: `Here are my notes:\n${notesText}`,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 300,
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json(
        { error: "Received empty summary from model" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Groq summarize error:", error);

    const err = error as { status?: number; message?: string };
    if (err.status === 429 || err.message?.toLowerCase().includes("rate limit")) {
      return NextResponse.json(
        {
          error:
            "Groq rate limit reached. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
