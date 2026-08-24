import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { getCurrentProfile, isDemoMode } from "@/lib/members/service";
import { createAccount } from "@/lib/members/actions";
import { Logo } from "@/components/layout/Logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

const field =
  "h-12 w-full rounded-2xl bg-raised px-4 text-base text-text transition-colors placeholder:text-faint";
const label = "mb-2 block text-sm font-semibold text-text";

const MESSAGES: Record<string, string> = {
  taken: "There is already an account on that email. Log in instead.",
  short: "Pick a password of at least six characters.",
  "1": "That did not go through. Check your email and try again.",
};

/**
 * Two fields and you are in.
 *
 * No approval, no confirmation email and nothing to wait for. A name and a
 * photo are asked for afterwards on the profile, where they are optional —
 * a signup that wants four things before it will show you anything is a
 * signup people abandon.
 */
export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const [profile, demo, query] = await Promise.all([
    getCurrentProfile(),
    isDemoMode(),
    searchParams,
  ]);
  if (profile) redirect(profile.role === "admin" ? "/admin" : "/app");

  const error = typeof query.e === "string" ? MESSAGES[query.e] : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10 sm:py-16">
      <Logo className="mx-auto" />

      <div className="mt-8 rounded-[var(--radius-sheet)] bg-surface p-6 sm:p-7">
        <h1 className="text-2xl">Create an account</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Email and a password. You are straight in — your name and photo can wait.
        </p>

        <form action={createAccount} className="mt-7 space-y-5">
          {error ? (
            <p className="inline-flex items-start gap-2 rounded-2xl bg-danger/10 p-3 text-sm text-danger">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <div>
            <label className={label} htmlFor="su-email">
              Email
            </label>
            <input
              id="su-email"
              className={field}
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className={label} htmlFor="su-password">
              Password
            </label>
            <input
              id="su-password"
              className={field}
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="h-12 w-full rounded-full bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
          >
            Create my account
          </button>

          {demo ? (
            <p className="text-xs leading-relaxed text-faint">
              Demo mode — no database is connected, so your password is not stored.
            </p>
          ) : null}
        </form>

        {/* The other door, said plainly. Somebody who wants coaching should not
            have to work out that this is not it. */}
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Want online training with Dean?{" "}
          <Link href="/join" className="font-semibold text-accent hover:underline">
            Apply here
          </Link>
          .
        </p>
      </div>

      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" />
          Back to the website
        </Link>
        <Link href="/login" className="font-semibold text-accent hover:underline">
          I already have an account
        </Link>
      </p>
    </main>
  );
}
