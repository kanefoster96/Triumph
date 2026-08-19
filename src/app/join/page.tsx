import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { getCurrentProfile, isDemoMode } from "@/lib/members/service";
import { Logo } from "@/components/layout/Logo";
import { JoinWizard } from "@/components/join/JoinWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Train with Dean",
  description:
    "Apply to train with Dean Foster. Tell him who you are and what you are after, and he will build you a plan.",
};

/**
 * The public way in.
 *
 * No plan to pick and no price to choose, because there is no shelf of
 * programmes — Dean reads what you sent and builds you something. So this
 * collects what he needs to do that and nothing else.
 */
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const [profile, query] = await Promise.all([getCurrentProfile(), searchParams]);
  /*
   * Signed in already? Only a basic account has anything to do here — they
   * made an account first and have decided they want coaching after all, so
   * the wizard runs without asking them to make a second one. Anybody who has
   * already applied, or is already a client, has nothing to apply for.
   */
  if (profile && (profile.role === "admin" || profile.status !== "basic")) {
    redirect(profile.role === "admin" ? "/admin" : "/app");
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-5 py-10 sm:py-16">
      <Logo className="mx-auto" />

      <div className="mt-8 text-center">
        <h1 className="text-3xl sm:text-4xl">Train with Dean</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Three short questions. He reads every one himself and comes back to you with what he would
          do — no plan to choose and nothing to pay yet.
        </p>
      </div>

      {query.e ? (
        <p className="mt-7 inline-flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {query.e === "taken" ? (
            <span>
              There is already an account on that email.{" "}
              <Link href="/login" className="font-semibold underline">
                Sign in instead
              </Link>
              .
            </span>
          ) : (
            "That did not go through. Check your email and password and try again."
          )}
        </p>
      ) : null}

      <div className="mt-9">
        <JoinWizard demo={await isDemoMode()} signedIn={Boolean(profile)} name={profile?.fullName ?? ""} />
      </div>

      <p className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" />
          Back to the website
        </Link>
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Already have an account?
        </Link>
      </p>
    </main>
  );
}
