import { Dumbbell, LogOut, UserRound } from "lucide-react";
import { enterDemoAs, exitDemo } from "@/lib/members/actions";
import { getCurrentProfile } from "@/lib/members/service";
import { cn } from "@/lib/utils";

/**
 * Demo sign-in switcher.
 *
 * Only rendered while Supabase is unconnected. Lets you drop straight into
 * either side of the product and out again, so both can be worked on without
 * a real auth system standing in the way.
 */
export async function DemoSignIn({ variant = "menu" }: { variant?: "menu" | "inline" }) {
  const profile = await getCurrentProfile();
  const menu = variant === "menu";

  const itemClass = menu
    ? "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-text transition-colors hover:bg-raised"
    : "inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent";

  return (
    <div className={cn(menu ? "space-y-1" : "flex flex-wrap gap-2")}>
      {profile ? (
        <>
          <p className={cn(menu ? "px-4 pb-1 text-xs text-faint" : "sr-only")}>
            Signed in as {profile.fullName} ({profile.role === "admin" ? "coach" : "client"})
          </p>
          <form
            action={async () => {
              "use server";
              await enterDemoAs(profile.role === "admin" ? "client" : "admin");
            }}
          >
            <button type="submit" className={itemClass}>
              {profile.role === "admin" ? (
                <UserRound className="h-4 w-4 shrink-0 text-accent" />
              ) : (
                <Dumbbell className="h-4 w-4 shrink-0 text-accent" />
              )}
              Switch to {profile.role === "admin" ? "client" : "coach"} demo
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await exitDemo();
            }}
          >
            <button type="submit" className={itemClass}>
              <LogOut className="h-4 w-4 shrink-0 text-faint" />
              Sign out
            </button>
          </form>
        </>
      ) : (
        <>
          <form
            action={async () => {
              "use server";
              await enterDemoAs("client");
            }}
          >
            <button type="submit" className={itemClass}>
              <UserRound className="h-4 w-4 shrink-0 text-accent" />
              Client demo
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await enterDemoAs("admin");
            }}
          >
            <button type="submit" className={itemClass}>
              <Dumbbell className="h-4 w-4 shrink-0 text-accent" />
              Coach demo
            </button>
          </form>
        </>
      )}
    </div>
  );
}
