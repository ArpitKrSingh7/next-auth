"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const isCanceled = searchParams.get("canceled") === "true";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        window.location.href = "/user";
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  async function handleCheckout() {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post("/api/payment/create-checkout-session");
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        setError("Failed to start checkout");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          Go Premium
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Unlock unlimited notes and AI-powered summaries.
        </p>

        {isSuccess && (
          <div className="mb-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">
            <p>Payment successful! Premium has been added to your account.</p>
            <p className="mt-1 text-xs opacity-80">Redirecting to your notes...</p>
          </div>
        )}

        {isCanceled && (
          <div className="mb-6 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm">
            Checkout canceled. You can try again whenever you are ready.
          </div>
        )}

        <ul className="text-left text-sm text-zinc-600 dark:text-zinc-400 space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <span className="text-amber-500">✓</span>
            Unlimited notes
          </li>
          <li className="flex items-center gap-2">
            <span className="text-amber-500">✓</span>
            AI briefs of your notes
          </li>
          <li className="flex items-center gap-2">
            <span className="text-amber-500">✓</span>
            Cancel anytime
          </li>
        </ul>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Checkout"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Checkout() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
