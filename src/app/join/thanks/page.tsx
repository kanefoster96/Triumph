import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCheck, Mail } from "lucide-react";
import { getCurrentProfile, getMyApplication } from "@/lib/members/service";
import { Logo } from "@/components/layout/Logo";
import { Avatar } from "@/components/members/Avatar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Application sent",
  robots: { index: false, follow: false },
};

/** What somebody sees the moment they have applied, and while they wait. */
export default async function JoinThanksPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/join");

  const application = await getMyApplication(profile.id);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-5 py-10 sm:py-16">
      <Logo className="mx-auto" />

      <div className="mt-8 rounded-[var(--radius-sheet)] border border-line bg-surface p-6 text-center sm:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/10">
          <CheckCheck className="h-7 w-7 text-accent" />
        </span>

        <h1 className="mt-5 text-2xl sm:text-3xl">Thanks, {profile.fullName.split(" ")[0]}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Dean will review your details and get back to you to propose your plan and get you
          enrolled.
        </p>

        {application ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-ink p-4 text-left">
            <Avatar name={application.fullName} src={application.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{application.fullName}</p>
              <p className="truncate text-xs text-faint">
                Sent{" "}
                {new Date(application.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}{" "}
                · waiting on Dean
              </p>
            </div>
          </div>
        ) : null}

        <p className="mt-6 inline-flex items-start gap-2 text-left text-xs leading-relaxed text-faint">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          He answers everything himself, so it is a reply from a person rather than an automatic
          one. In the meantime your account is open — there is just nothing in it yet.
        </p>
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/app" className="font-semibold text-accent hover:underline">
          Go to my account
        </Link>
      </p>
    </main>
  );
}
