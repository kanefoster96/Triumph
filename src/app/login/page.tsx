import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, isDemoMode } from "@/lib/members/service";
import { Logo } from "@/components/layout/Logo";
import { LoginForm } from "@/components/members/LoginForm";
import { DemoSignIn } from "@/components/members/DemoSignIn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const [profile, demo] = await Promise.all([getCurrentProfile(), isDemoMode()]);
  if (profile) redirect(profile.role === "admin" ? "/admin" : "/app");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
      <Logo className="mx-auto" />

      <div className="mt-10 rounded-[var(--radius-sheet)] border border-line bg-surface p-7">
        <h1 className="text-2xl">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          For coaching clients. Dean sets your account up — there is no public signup.
        </p>

        {demo ? (
          <>
            <p className="mt-5 rounded-2xl border border-amber/25 bg-amber/10 p-4 text-sm text-amber">
              No database connected yet, so real sign-in is disabled. Pick a demo account to look
              around — either side of the product works.
            </p>
            <div className="mt-4">
              <DemoSignIn />
            </div>
          </>
        ) : (
          <LoginForm />
        )}
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-muted hover:text-text">
          Back to the website
        </Link>
      </p>
    </main>
  );
}
