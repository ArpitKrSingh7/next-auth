"use client";

import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

type Priority = "LOW" | "MEDIUM" | "HIGH";

interface Note {
  id: string;
  title: string | null;
  content: string;
  priority: Priority;
  color: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const priorityStyles: Record<Priority, string> = {
  LOW: "bg-blue-100 text-blue-700 border-blue-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  HIGH: "bg-red-100 text-red-700 border-red-200",
};

const priorityOrder: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const colorOptions = [
  { label: "Default", value: "" },
  { label: "Yellow", value: "#fef3c7" },
  { label: "Green", value: "#dcfce7" },
  { label: "Blue", value: "#dbeafe" },
  { label: "Pink", value: "#fce7f3" },
  { label: "Purple", value: "#f3e8ff" },
];

export default function User() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "MEDIUM" as Priority,
    color: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    if (status === "authenticated") {
      // If the JWT exists but doesn't have a valid internal user id,
      // force a re-login to clear the stale session.
      if (!session?.user?.id) {
        signOut({ callbackUrl: "/signin" });
        return;
      }
      fetchNotes();
    }
  }, [status, session, router]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/notes");
      setNotes(res.data.notes);
    } catch (err) {
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setForm({ title: "", content: "", priority: "MEDIUM", color: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setForm({
      title: note.title || "",
      content: note.content,
      priority: note.priority,
      color: note.color || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingNote) {
        await axios.patch(`/api/notes/${editingNote.id}`, form);
      } else {
        await axios.post("/api/notes", form);
      }
      closeModal();
      fetchNotes();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to save note");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await axios.delete(`/api/notes/${id}`);
      fetchNotes();
    } catch (err) {
      setError("Failed to delete note");
    }
  };

  const handleShare = async (note: Note) => {
    try {
      const nextPublic = !note.isPublic;
      await axios.patch(`/api/notes/${note.id}`, { isPublic: nextPublic });

      if (nextPublic) {
        const shareUrl = `${window.location.origin}/note/${note.id}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopiedId(note.id);
        setTimeout(() => setCopiedId(null), 2000);
      }

      fetchNotes();
    } catch (err) {
      setError("Failed to update sharing settings");
    }
  };

  const handleSummarize = async () => {
    if (notes.length === 0) return;

    try {
      setSummaryLoading(true);
      setError("");
      const res = await axios.post("/api/summarize", { notes });
      setSummary(res.data.summary);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to generate summary");
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              My Notes
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {session?.user?.email || session?.user?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-zinc-600 dark:text-zinc-400">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </p>
          <div className="flex items-center gap-3">
            {notes.length > 0 && (
              <button
                onClick={handleSummarize}
                disabled={summaryLoading}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {summaryLoading ? "Summarizing..." : "Generate Brief"}
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              + New Note
            </button>
          </div>
        </div>

        {summary && (
          <div className="mb-6 p-5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-purple-900 dark:text-purple-300">
                Brief
              </h2>
              <button
                onClick={() => setSummary("")}
                className="text-xs text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
              >
                Hide
              </button>
            </div>
            <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap leading-relaxed">
              {summary}
            </p>
          </div>
        )}

        {sortedNotes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400 mb-2">
              No notes yet
            </p>
            <button
              onClick={openCreateModal}
              className="text-zinc-900 dark:text-white font-medium hover:underline"
            >
              Create your first note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNotes.map((note) => {
              const hasColor = !!note.color;
              return (
                <div
                  key={note.id}
                  className="relative rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-zinc-900"
                  style={{ backgroundColor: note.color || undefined }}
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full border ${priorityStyles[note.priority]}`}
                      >
                        {note.priority}
                      </span>
                      {note.isPublic && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full border bg-green-100 text-green-700 border-green-200">
                          Public
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleShare(note)}
                        className={`text-xs ${note.isPublic ? "text-green-600 hover:text-green-700" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"}`}
                        title={
                          note.isPublic
                            ? "Click to make private"
                            : "Click to make public and copy link"
                        }
                      >
                        {copiedId === note.id
                          ? "Copied!"
                          : note.isPublic
                            ? "Share"
                            : "Make public"}
                      </button>
                      <button
                        onClick={() => openEditModal(note)}
                        className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {note.title && (
                    <h3
                      className={`font-semibold mb-2 ${hasColor ? "text-zinc-900" : "text-zinc-900 dark:text-white"}`}
                    >
                      {note.title}
                    </h3>
                  )}
                  <p
                    className={`whitespace-pre-wrap text-sm ${hasColor ? "text-zinc-700" : "text-zinc-700 dark:text-zinc-300"}`}
                  >
                    {note.content}
                  </p>

                  <p
                    className={`mt-4 text-xs ${hasColor ? "text-zinc-500" : "text-zinc-500 dark:text-zinc-400"}`}
                  >
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
              {editingNote ? "Edit Note" : "New Note"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-500"
                  placeholder="Note title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Content *
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  required
                  rows={4}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-500"
                  placeholder="Write your note here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        priority: e.target.value as Priority,
                      }))
                    }
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Color
                  </label>
                  <select
                    value={form.color}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-500"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  {editingNote ? "Save Changes" : "Create Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
