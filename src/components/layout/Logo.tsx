import Link from "next/link";
import { site } from "@/lib/data/site";
import { cn } from "@/lib/utils";

/**
 * Wordmark. The three ascending bars read as progress — the thing the whole
 * business is about — and cost nothing to render.
 */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label={`${site.name} home`}>
      <svg viewBox="0 0 28 24" className="h-6 w-7 shrink-0" aria-hidden focusable="false">
        <rect x="0" y="14" width="6" height="10" rx="2" fill="currentColor" className="text-accent/50" />
        <rect x="9" y="7" width="6" height="17" rx="2" fill="currentColor" className="text-accent/75" />
        <rect x="18" y="0" width="6" height="24" rx="2" fill="currentColor" className="text-accent" />
      </svg>
      <span className="font-display text-[15px] leading-tight font-bold tracking-tight">
        Triumph
        <span className="block text-[15px] font-bold text-muted">Training</span>
      </span>
    </Link>
  );
}
