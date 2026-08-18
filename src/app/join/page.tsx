import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/members/service";
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
export default async function JoinPage() {
  // Already signed in: there is nothing to apply for.
  const profile = await getCurrentProfile();
  if (profile) redirect(profile.role === "admin" ? "/admin" : "/app");

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

      <div className="mt-9">
        <JoinWizard />
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
