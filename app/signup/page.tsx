"use client";

import axios from "axios";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

export default function SignUp() {
  const router = useRouter();
  const { status } = useSession();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/user");
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("/api/auth/signup", form);

      // Auto sign in after successful signup
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
        callbackUrl: "/user",
      });

      if (result?.error) {
        setError("Account created, but sign in failed. Please try signing in.");
        setLoading(false);
        return;
      }

      router.push("/user");
      router.refresh();
    } catch (err) {
      setLoading(false);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
          Create an account
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Start creating your notes
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-500"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-500"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Must be at least 6 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 dark:bg-white px-4 py-2.5 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-medium text-zinc-900 dark:text-white hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
