import { Info } from "lucide-react";
import { setDemoRole } from "@/lib/members/actions";
import type { UserRole } from "@/lib/members/types";

/**
 * Only rendered while Supabase is not connected. Makes it unmistakable that
 * nothing here is real yet, and lets you flip between the two sides of the
 * product without an auth system.
 */
export function DemoBanner({ role }: { role: UserRole }) {
  return (
    <div className="border-b border-amber/25 bg-amber/10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-5 py-2.5 sm:px-8">
        <Info className="h-4 w-4 shrink-0 text-amber" />
        <p className="text-xs text-amber">
          Demo data — no database connected. Changes last until the server restarts.
        </p>
        <form className="ml-auto flex items-center gap-2">
          <span className="text-xs text-amber/80">Viewing as</span>
          <button
            formAction={async () => {
              "use server";
              await setDemoRole(role === "admin" ? "client" : "admin");
            }}
            className="-my-2 inline-flex min-h-11 items-center rounded-full border border-amber/40 px-3 text-xs font-semibold text-amber transition-colors hover:bg-amber/15"
          >
            {role === "admin" ? "Dean (admin)" : "Client"} · switch
          </button>
        </form>
      </div>
    </div>
  );
}
