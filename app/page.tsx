import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "./lib/auth";
import ThemeToggle from "./components/ThemeToggle";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navbar */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-zinc-900 dark:text-white">
            Brainly
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session?.user ? (
              <>
                <span className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline">
                  {session.user.email || session.user.name}
                </span>
                <Link
                  href="/user"
                  className="rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  My Notes
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-6">
            Dump your brain, one note at a time
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed">
            A simple sticky-notes app for your thoughts, tasks, and ideas. Set
            priorities, pick colors, and keep everything organized.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {session?.user ? (
              <Link
                href="/user"
                className="w-full sm:w-auto rounded-lg bg-zinc-900 dark:bg-white px-8 py-3 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Go to my notes
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto rounded-lg bg-zinc-900 dark:bg-white px-8 py-3 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Start for free
                </Link>
                <Link
                  href="/signin"
                  className="w-full sm:w-auto rounded-lg border border-zinc-300 dark:border-zinc-700 px-8 py-3 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-white dark:hover:bg-zinc-900 transition-colors"
                >
                  Already have an account?
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24">
          <FeatureCard
            title="Quick notes"
            description="Jot down ideas instantly without friction."
          />
          <FeatureCard
            title="Prioritize"
            description="Mark notes as Low, Medium, or High priority."
          />
          <FeatureCard
            title="Color coded"
            description="Organize your thoughts with sticky-note colors."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
      <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm">{description}</p>
    </div>
  );
}
