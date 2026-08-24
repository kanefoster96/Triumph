import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { getCurrentProfile, isDemoMode } from "@/lib/members/service";
import { signIn } from "@/lib/members/actions";
import { Logo } from "@/components/layout/Logo";
import { DemoSignIn } from "@/components/members/DemoSignIn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const field =
  "h-12 w-full rounded-2xl bg-raised px-4 text-base text-text transition-colors placeholder:text-faint";
const label = "mb-2 block text-sm font-semibold text-text";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [profile, demo, query] = await Promise.all([
    getCurrentProfile(),
    isDemoMode(),
    searchParams,
  ]);
  if (profile) redirect(profile.role === "admin" ? "/admin" : "/app");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10 sm:py-16">
      <Logo className="mx-auto" />

      <div className="mt-8 rounded-[var(--radius-sheet)] bg-surface p-6 sm:p-7">
        <h1 className="text-2xl">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          For clients Dean is coaching. New here?{" "}
          <Link
            href="/join"
            className="font-semibold text-accent hover:underline"
          >
            Apply to train
          </Link>
          .
        </p>

        {/* One form for both modes. The action decides what to do with it —
            Supabase when it is connected, the demo accounts when it is not —
            and where somebody lands is read off their profile either way. */}
        <form action={signIn} className="mt-6 space-y-4">
          {query.e === "1" ? (
            <p className="inline-flex items-start gap-2 rounded-2xl bg-danger/10 p-3 text-sm text-danger">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {demo
                ? "No account with that email. Check it, or apply to train."
                : "That email and password did not match. Try again, or apply to train."}
            </p>
          ) : null}

          <div>
            <label className={label} htmlFor="in-email">
              Email
            </label>
            <input
              id="in-email"
              className={field}
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className={label} htmlFor="in-password">
              Password
            </label>
            <input
              id="in-password"
              className={field}
              type="password"
              name="password"
              required={!demo}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="h-12 w-full rounded-full bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
          >
            Sign in
          </button>

          {/* On the page, not just in the code, while it is true. */}
          {demo ? (
            <p className="text-xs leading-relaxed text-faint">
              Demo mode — no database is connected, so passwords are neither
              stored nor checked and your email alone signs you in.
            </p>
          ) : null}
        </form>

        {demo ? (
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold text-faint">
              Or look round with a demo account
            </p>
            <DemoSignIn />
          </div>
        ) : null}
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-muted hover:text-text">
          Back to the website
        </Link>
      </p>
    </main>
  );
}
