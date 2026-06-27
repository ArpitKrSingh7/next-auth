import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "../../../lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicNotePage({ params }: PageProps) {
  const { id } = await params;

  const note = await prisma.note.findFirst({
    where: { id, isPublic: true },
    include: {
      user: {
        select: {
          name: true,
          username: true,
        },
      },
    },
  });

  if (!note) {
    notFound();
  }

  const authorName = note.user?.name || note.user?.username || "Anonymous";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6 inline-block"
        >
          ← Back to Brainly
        </Link>

        <div
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm"
          style={{ backgroundColor: note.color || "transparent" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full border ${
                note.priority === "HIGH"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : note.priority === "MEDIUM"
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-blue-100 text-blue-700 border-blue-200"
              }`}
            >
              {note.priority}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Shared by {authorName}
            </span>
          </div>

          {note.title && (
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-900 mb-4">
              {note.title}
            </h1>
          )}

          <p className="text-zinc-700 dark:text-zinc-800 whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>

          <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-600">
            Shared on {new Date(note.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
